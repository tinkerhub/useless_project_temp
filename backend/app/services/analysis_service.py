"""
Analysis lifecycle orchestrator.

Controls the full pipeline:
  video validation → tracking → metrics → aggregation → persistence

Processing states (docs/BACKEND.md §8):
  queued → processing → completed | failed | tracking_lost

Runs as a FastAPI background task (docs/BACKEND.md §30).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import PROCESSED_DIR, UPLOADS_DIR
from app.cv.tracker import track_video
from app.cv.trajectory import build_trajectory_points, save_trajectory
from app.database.models import AnalysisModel
from app.metrics.center_accuracy import compute_center_accuracy
from app.metrics.kinetics import compute_kinetics
from app.metrics.rpm import compute_rpm
from app.metrics.wobble import compute_wobble
from app.services.result_service import aggregate_results
from app.services.video_service import VideoValidationError, validate_and_extract


def create_analysis_record(
    db: Session,
    filename: str,
    video_path: str,
    analysis_id: str,
) -> AnalysisModel:
    """Insert a new analysis row in queued state."""
    record = AnalysisModel(
        id=analysis_id,
        filename=filename,
        video_path=video_path,
        status="queued",
        progress=0,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_analysis(db: Session, analysis_id: str) -> Optional[AnalysisModel]:
    return db.query(AnalysisModel).filter(AnalysisModel.id == analysis_id).first()


def _set_status(db: Session, record: AnalysisModel, status: str, **kwargs) -> None:
    record.status = status
    for key, val in kwargs.items():
        setattr(record, key, val)
    db.commit()


async def save_upload(upload: UploadFile, analysis_id: str) -> Path:
    """Save the uploaded file to storage/uploads/{id}/original.{ext}."""
    upload_dir = UPLOADS_DIR / analysis_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(upload.filename or "video.mp4").suffix or ".mp4"
    dest = upload_dir / f"original{ext}"
    async with aiofiles.open(dest, "wb") as out:
        content = await upload.read()
        await out.write(content)
    return dest


def run_analysis(analysis_id: str, video_path: Path, db_session_factory) -> None:
    """
    Full synchronous analysis pipeline.  Called from a FastAPI background task.

    1. Validate video
    2. Update DB to 'processing'
    3. Run frame-by-frame tracking with progress callbacks
    4. Compute all metrics
    5. Save trajectory
    6. Aggregate results
    7. Update DB to 'completed' (or failure state)
    """
    db: Session = db_session_factory()

    try:
        record = get_analysis(db, analysis_id)
        if record is None:
            return

        # ---- Validate ----
        try:
            meta = validate_and_extract(video_path, record.filename)
        except VideoValidationError as exc:
            _set_status(
                db,
                record,
                "failed",
                failure_reason=exc.message,
            )
            return

        # Persist video metadata
        record.fps = meta.fps
        record.duration = meta.duration
        record.width = meta.width
        record.height = meta.height
        record.total_frames = meta.total_frames
        _set_status(db, record, "processing", progress=0)

        # ---- Track ----
        def _progress(current: int, total: int) -> None:
            pct = int((current / total) * 100) if total > 0 else 0
            record.progress = pct
            record.status = "processing"
            db.commit()

        tracking_result = track_video(video_path, progress_callback=_progress)

        if tracking_result.tracking_lost:
            _set_status(
                db,
                record,
                "tracking_lost",
                failure_reason=tracking_result.failure_reason,
                progress=record.progress,
            )
            return

        if not tracking_result.records:
            _set_status(
                db,
                record,
                "failed",
                failure_reason="No frames were successfully tracked.",
            )
            return

        # ---- Extract tracking data ----
        # Use only "detected" frames for metric calculations;
        # "estimated" frames are excluded from metric calc but kept in trajectory.
        detected_records = [r for r in tracking_result.records if r.tracking_state == "detected"]
        all_records = tracking_result.records

        pen_positions = [(r.center_x, r.center_y) for r in detected_records]
        timestamps = [r.timestamp for r in detected_records]
        all_positions = [(r.center_x, r.center_y) for r in all_records]
        all_frame_indices = [r.frame for r in all_records]

        # Use tracking rotation centre; fall back to midpoint of pen path
        rotation_center = tracking_result.rotation_center
        if rotation_center is None and pen_positions:
            xs = [p[0] for p in pen_positions]
            ys = [p[1] for p in pen_positions]
            rotation_center = (sum(xs) / len(xs), sum(ys) / len(ys))

        if rotation_center is None:
            _set_status(db, record, "failed", failure_reason="Could not determine rotation centre.")
            return

        # ---- Metrics ----
        rpm, rotations = compute_rpm(pen_positions, timestamps, rotation_center)
        _, center_accuracy = compute_center_accuracy(pen_positions, rotation_center)
        _, wobble_percent = compute_wobble(pen_positions, rotation_center)
        avg_vel, peak_vel, avg_acc, peak_acc = compute_kinetics(pen_positions, timestamps)

        # Tracking confidence: mean of detected frame confidences
        confidences = [r.tracking_confidence for r in detected_records if r.tracking_confidence > 0]
        tracking_confidence = round((sum(confidences) / len(confidences)) * 100, 2) if confidences else 0.0

        # ---- Aggregate & score ----
        aggregated = aggregate_results(
            rpm=rpm,
            rotations=rotations,
            center_accuracy=center_accuracy,
            wobble_percent=wobble_percent,
            avg_velocity=avg_vel,
            peak_velocity=peak_vel,
            avg_acceleration=avg_acc,
            peak_acceleration=peak_acc,
            tracking_confidence=tracking_confidence,
        )

        # ---- Save trajectory ----
        processed_dir = PROCESSED_DIR / analysis_id
        traj_points = build_trajectory_points(all_positions, all_frame_indices)
        save_trajectory(traj_points, processed_dir)

        # ---- Persist results ----
        record.rpm = aggregated.rpm
        record.center_accuracy = aggregated.center_accuracy
        record.wobble_percent = aggregated.wobble_percent
        record.average_velocity = aggregated.average_velocity
        record.peak_velocity = aggregated.peak_velocity
        record.average_acceleration = aggregated.average_acceleration
        record.peak_acceleration = aggregated.peak_acceleration
        record.tracking_confidence = aggregated.tracking_confidence
        record.rotations = aggregated.rotations
        record.overall_score = aggregated.overall_score
        record.completed_at = datetime.now(timezone.utc)
        _set_status(db, record, "completed", progress=100)

    except Exception as exc:
        try:
            record = get_analysis(db, analysis_id)
            if record:
                _set_status(
                    db,
                    record,
                    "failed",
                    failure_reason=f"Unexpected error during analysis: {type(exc).__name__}",
                )
        except Exception:
            pass
        # Re-raise for background task logging — but never expose to API clients
        raise
    finally:
        db.close()
