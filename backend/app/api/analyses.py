"""
Analysis REST endpoints.

Implements the shared API contract from docs/TEAM_SHARED_CONTRACT.md §4.1:

  POST   /api/analyses
  GET    /api/analyses/{id}/status
  GET    /api/analyses/{id}
  GET    /api/analyses/{id}/trajectory
  GET    /api/analyses/{id}/video
  DELETE /api/analyses/{id}

Do NOT rename or restructure these endpoints without updating
TEAM_SHARED_CONTRACT.md and informing the frontend owner.
"""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from app.config import ALLOWED_EXTENSIONS, PROCESSED_DIR, UPLOADS_DIR
from app.cv.trajectory import load_trajectory
from app.database.database import SessionLocal, get_db
from app.database.models import AnalysisModel
from app.schemas.analysis import (
    AnalysisResponse,
    CreateAnalysisResponse,
    ErrorResponse,
    FilesSchema,
    LowFPSWarning,
    ResultsSchema,
    StatusResponse,
    TrajectoryPoint,
    TrajectoryResponse,
    VideoMetaSchema,
)
from app.services.analysis_service import (
    create_analysis_record,
    get_analysis,
    run_analysis,
    save_upload,
)

router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _not_found(analysis_id: str) -> HTTPException:
    return HTTPException(
        status_code=404,
        detail={"error": "NOT_FOUND", "message": f"Analysis '{analysis_id}' not found."},
    )


def _db_to_response(record: AnalysisModel, analysis_id: str) -> AnalysisResponse:
    """Map an ORM record to the AnalysisResponse schema."""
    video_meta = None
    if record.fps is not None:
        video_meta = VideoMetaSchema(
            fps=record.fps,
            duration=record.duration or 0.0,
            total_frames=record.total_frames or 0,
            width=record.width,
            height=record.height,
        )

    results = None
    if record.status == "completed" and record.rpm is not None:
        results = ResultsSchema(
            rpm=record.rpm,
            center_accuracy=record.center_accuracy or 0.0,
            wobble_percent=record.wobble_percent or 0.0,
            average_velocity=record.average_velocity or 0.0,
            peak_velocity=record.peak_velocity or 0.0,
            average_acceleration=record.average_acceleration or 0.0,
            peak_acceleration=record.peak_acceleration or 0.0,
            tracking_confidence=record.tracking_confidence or 0.0,
            rotations=record.rotations or 0,
            overall_score=record.overall_score,
        )

    files = None
    if record.status == "completed":
        files = FilesSchema(
            trajectory=f"/api/analyses/{analysis_id}/trajectory",
            overlay_video=f"/api/analyses/{analysis_id}/video",
        )

    return AnalysisResponse(
        analysis_id=record.id,
        status=record.status,
        video=video_meta,
        results=results,
        files=files,
        failure_reason=record.failure_reason,
        created_at=record.created_at,
        completed_at=record.completed_at,
    )


# ---------------------------------------------------------------------------
# POST /api/analyses
# ---------------------------------------------------------------------------


@router.post(
    "/analyses",
    response_model=CreateAnalysisResponse,
    status_code=202,
    tags=["Analyses"],
    summary="Upload a video and create an analysis job",
)
async def upload_and_create(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(..., description="Pen-spinning video file"),
    db: Session = Depends(get_db),
) -> CreateAnalysisResponse:
    """
    Upload a pen-spinning video and schedule analysis as a background task.

    Returns analysis_id for subsequent status and results polling.
    """
    if not video.filename:
        raise HTTPException(
            status_code=422,
            detail={"error": "INVALID_VIDEO", "message": "No filename provided."},
        )

    # Validate extension synchronously before saving
    ext = Path(video.filename).suffix.lstrip(".").lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "INVALID_VIDEO",
                "message": f"File extension '.{ext}' is not supported. "
                           f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            },
        )

    analysis_id = uuid.uuid4().hex[:12]

    # Save upload to disk
    try:
        video_path = await save_upload(video, analysis_id)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "UPLOAD_FAILED", "message": "Could not save uploaded file."},
        ) from exc

    # Create DB record in queued state
    create_analysis_record(
        db=db,
        filename=video.filename,
        video_path=str(video_path),
        analysis_id=analysis_id,
    )

    # Schedule analysis in background — non-blocking
    background_tasks.add_task(
        run_analysis,
        analysis_id=analysis_id,
        video_path=video_path,
        db_session_factory=SessionLocal,
    )

    # Quick pre-flight check for low FPS warning (non-blocking)
    warning = None
    try:
        import cv2

        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS)
        cap.release()
        if fps > 0 and fps < 60:
            warning = LowFPSWarning(warning="Low frame rate detected", fps=fps)
    except Exception:
        pass

    return CreateAnalysisResponse(
        analysis_id=analysis_id,
        status="queued",
        warning=warning,
    )


# ---------------------------------------------------------------------------
# GET /api/analyses/{analysis_id}/status
# ---------------------------------------------------------------------------


@router.get(
    "/analyses/{analysis_id}/status",
    response_model=StatusResponse,
    tags=["Analyses"],
    summary="Poll processing status and progress",
)
async def get_status(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> StatusResponse:
    record = get_analysis(db, analysis_id)
    if record is None:
        raise _not_found(analysis_id)

    return StatusResponse(
        analysis_id=record.id,
        status=record.status,
        progress=record.progress,
        current_frame=None,   # fine-grained frame reported via DB progress %
        total_frames=record.total_frames,
        failure_reason=record.failure_reason,
    )


# ---------------------------------------------------------------------------
# GET /api/analyses/{analysis_id}
# ---------------------------------------------------------------------------


@router.get(
    "/analyses/{analysis_id}",
    response_model=AnalysisResponse,
    tags=["Analyses"],
    summary="Get full analysis result",
)
async def get_analysis_result(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    record = get_analysis(db, analysis_id)
    if record is None:
        raise _not_found(analysis_id)
    return _db_to_response(record, analysis_id)


# ---------------------------------------------------------------------------
# GET /api/analyses/{analysis_id}/trajectory
# ---------------------------------------------------------------------------


@router.get(
    "/analyses/{analysis_id}/trajectory",
    response_model=TrajectoryResponse,
    tags=["Analyses"],
    summary="Get trajectory points for visualisation",
)
async def get_trajectory(
    analysis_id: str,
    db: Session = Depends(get_db),
) -> TrajectoryResponse:
    record = get_analysis(db, analysis_id)
    if record is None:
        raise _not_found(analysis_id)

    if record.status not in ("completed", "tracking_lost"):
        raise HTTPException(
            status_code=409,
            detail={
                "error": "NOT_READY",
                "message": f"Analysis is not complete (status: {record.status}).",
            },
        )

    processed_dir = PROCESSED_DIR / analysis_id
    raw_points = load_trajectory(processed_dir)

    points = [TrajectoryPoint(**p) for p in raw_points]
    return TrajectoryResponse(points=points)


# ---------------------------------------------------------------------------
# GET /api/analyses/{analysis_id}/video
# ---------------------------------------------------------------------------


@router.get(
    "/analyses/{analysis_id}/video",
    tags=["Analyses"],
    summary="Stream the original uploaded video (for client-side overlay replay)",
)
async def get_video(
    analysis_id: str,
    db: Session = Depends(get_db),
):
    record = get_analysis(db, analysis_id)
    if record is None:
        raise _not_found(analysis_id)

    video_path = Path(record.video_path)
    if not video_path.exists():
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "message": "Video file not found on disk."},
        )

    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=f"{analysis_id}_original.mp4",
    )


# ---------------------------------------------------------------------------
# DELETE /api/analyses/{analysis_id}
# ---------------------------------------------------------------------------


@router.delete(
    "/analyses/{analysis_id}",
    tags=["Analyses"],
    summary="Delete an analysis and its files",
    status_code=200,
)
async def delete_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
):
    record = get_analysis(db, analysis_id)
    if record is None:
        raise _not_found(analysis_id)

    # Remove from DB
    db.delete(record)
    db.commit()

    # Remove files — best-effort, non-fatal
    import shutil

    for directory in (UPLOADS_DIR / analysis_id, PROCESSED_DIR / analysis_id):
        if directory.exists():
            shutil.rmtree(directory, ignore_errors=True)

    return {"status": "deleted", "analysis_id": analysis_id}
