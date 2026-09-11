"""
Frame-by-frame tracking orchestrator.

Integrates pen detection, hand detection, occlusion handling, and
tracking-failure logic into a single pipeline.

Tracking states per frame (docs/BACKEND.md §19, §20):
  "detected"   — pen found directly via CV
  "estimated"  — interpolated during short occlusion
  "lost"       — tracking failed irrecoverably

Tracking terminates if pen is not recoverable within MAX_OCCLUDED_FRAMES.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, List, Optional, Tuple

import cv2
import numpy as np

from app.config import MAX_OCCLUDED_FRAMES
from app.cv.hand_detector import detect_rotation_center
from app.cv.pen_detector import bounding_box_center, detect_pen


@dataclass
class FrameRecord:
    """Per-frame tracking data — mirrors BACKEND.md §13 JSON structure."""

    frame: int
    timestamp: float
    x: float
    y: float
    width: int
    height: int
    center_x: float
    center_y: float
    tracking_confidence: float
    tracking_state: str  # "detected" | "estimated" | "lost"


@dataclass
class TrackingResult:
    """Aggregate output of the full tracking pass."""

    records: List[FrameRecord] = field(default_factory=list)
    rotation_center: Optional[Tuple[float, float]] = None
    tracking_lost: bool = False
    failure_reason: str = ""


def track_video(
    video_path: Path,
    progress_callback: Optional[Callable[[int, int], None]] = None,
) -> TrackingResult:
    """
    Process every frame in the video file.

    Parameters
    ----------
    video_path        : absolute path to the uploaded video.
    progress_callback : optional callable(current_frame, total_frames) for
                        streaming progress to the status endpoint.

    Returns
    -------
    TrackingResult with per-frame records and aggregated tracking state.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return TrackingResult(tracking_lost=True, failure_reason="Cannot open video file")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    result = TrackingResult()
    occluded_count = 0
    last_bbox: Optional[Tuple[int, int, int, int]] = None
    last_center: Optional[Tuple[float, float]] = None
    rotation_center_found = False
    rotation_center: Optional[Tuple[float, float]] = None

    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        timestamp = frame_idx / fps
        bbox, confidence = detect_pen(frame)

        # Try to establish/update rotation centre (only when hand is visible)
        if not rotation_center_found or frame_idx % 30 == 0:
            rc = detect_rotation_center(frame)
            if rc is not None:
                rotation_center = rc
                rotation_center_found = True

        if bbox is not None:
            # DETECTED — direct CV detection
            cx, cy = bounding_box_center(bbox)
            x, y, w, h = bbox
            record = FrameRecord(
                frame=frame_idx,
                timestamp=timestamp,
                x=float(x),
                y=float(y),
                width=w,
                height=h,
                center_x=cx,
                center_y=cy,
                tracking_confidence=confidence,
                tracking_state="detected",
            )
            last_bbox = bbox
            last_center = (cx, cy)
            occluded_count = 0
        else:
            # No direct detection
            occluded_count += 1

            if occluded_count > MAX_OCCLUDED_FRAMES:
                # TRACKING LOST — irrecoverable
                result.tracking_lost = True
                result.failure_reason = (
                    f"Pen lost for {occluded_count} consecutive frames "
                    f"(threshold: {MAX_OCCLUDED_FRAMES})"
                )
                break

            if last_center is not None and last_bbox is not None:
                # ESTIMATED — interpolate using last known position
                cx, cy = last_center
                x, y, w, h = last_bbox
                record = FrameRecord(
                    frame=frame_idx,
                    timestamp=timestamp,
                    x=float(x),
                    y=float(y),
                    width=w,
                    height=h,
                    center_x=cx,
                    center_y=cy,
                    tracking_confidence=0.0,
                    tracking_state="estimated",
                )
            else:
                # No prior data yet — skip frame
                frame_idx += 1
                if progress_callback and total_frames > 0:
                    progress_callback(frame_idx, total_frames)
                continue

        result.records.append(record)

        frame_idx += 1
        if progress_callback and total_frames > 0:
            progress_callback(frame_idx, total_frames)

    cap.release()
    result.rotation_center = rotation_center
    return result
