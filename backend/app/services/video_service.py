"""
Video validation and metadata extraction.

Validation rules from docs/BACKEND.md §7:
  File-level:
    - exists
    - readable
    - supported extension
    - within size limit

  Video-level:
    - FPS readable
    - at least one decodable frame
    - width and height valid
    - duration > 0
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2

from app.config import ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES


class VideoValidationError(Exception):
    """Raised when a file fails validation."""

    def __init__(self, error_code: str, message: str):
        self.error_code = error_code
        self.message = message
        super().__init__(message)


@dataclass
class VideoMetadata:
    fps: float
    duration: float
    width: int
    height: int
    total_frames: int
    low_fps_warning: bool = False


def validate_and_extract(file_path: Path, original_filename: str) -> VideoMetadata:
    """
    Validate the uploaded video and extract its metadata.

    Parameters
    ----------
    file_path         : path to the saved upload on disk.
    original_filename : original name for extension checking.

    Returns
    -------
    VideoMetadata if valid.

    Raises
    ------
    VideoValidationError on any validation failure.
    """
    # ---- File-level checks ----
    if not file_path.exists():
        raise VideoValidationError("INVALID_VIDEO", "Uploaded file does not exist on disk.")

    size = file_path.stat().st_size
    if size == 0:
        raise VideoValidationError("INVALID_VIDEO", "Uploaded file is empty.")
    if size > MAX_UPLOAD_BYTES:
        raise VideoValidationError(
            "INVALID_VIDEO",
            f"File size {size} bytes exceeds maximum of {MAX_UPLOAD_BYTES} bytes.",
        )

    ext = Path(original_filename).suffix.lstrip(".").lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise VideoValidationError(
            "INVALID_VIDEO",
            f"File extension '.{ext}' is not supported. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # ---- Video-level checks ----
    cap = cv2.VideoCapture(str(file_path))
    if not cap.isOpened():
        raise VideoValidationError("INVALID_VIDEO_METADATA", "Unable to open video file.")

    fps: float = cap.get(cv2.CAP_PROP_FPS)
    width: int = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height: int = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count: int = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if fps <= 0:
        cap.release()
        raise VideoValidationError("INVALID_VIDEO_METADATA", "Cannot determine video FPS.")
    if width <= 0 or height <= 0:
        cap.release()
        raise VideoValidationError("INVALID_VIDEO_METADATA", "Invalid video dimensions.")
    if frame_count <= 0:
        cap.release()
        raise VideoValidationError("INVALID_VIDEO_METADATA", "Video has no frames.")

    # Try decoding at least one frame
    ret, _ = cap.read()
    cap.release()
    if not ret:
        raise VideoValidationError("INVALID_VIDEO_METADATA", "Cannot decode video frames.")

    duration = frame_count / fps
    if duration <= 0:
        raise VideoValidationError("INVALID_VIDEO_METADATA", "Video duration is zero.")

    return VideoMetadata(
        fps=round(fps, 2),
        duration=round(duration, 4),
        width=width,
        height=height,
        total_frames=frame_count,
        low_fps_warning=(fps < 60),
    )
