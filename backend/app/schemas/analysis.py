"""
Pydantic schemas for request and response validation.

Field names are canonical — defined in docs/TEAM_SHARED_CONTRACT.md §8.
Do NOT rename these without updating the shared contract first.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Sub-schemas
# ---------------------------------------------------------------------------


class VideoMetaSchema(BaseModel):
    fps: float
    duration: float
    total_frames: int
    width: Optional[int] = None
    height: Optional[int] = None


class ResultsSchema(BaseModel):
    """Primary and supporting metrics — canonical field names."""

    rpm: float
    center_accuracy: float
    wobble_percent: float
    average_velocity: float
    peak_velocity: float
    average_acceleration: float
    peak_acceleration: float
    tracking_confidence: float
    rotations: int
    overall_score: Optional[float] = None


class FilesSchema(BaseModel):
    trajectory: str
    overlay_video: str


class TrajectoryPoint(BaseModel):
    frame: int
    x: float
    y: float


class TrajectoryResponse(BaseModel):
    points: List[TrajectoryPoint]


class LowFPSWarning(BaseModel):
    warning: str
    fps: float
    recommended_fps: int = 120


# ---------------------------------------------------------------------------
# Upload / create
# ---------------------------------------------------------------------------


class CreateAnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    warning: Optional[LowFPSWarning] = None


# ---------------------------------------------------------------------------
# Status polling
# ---------------------------------------------------------------------------


class StatusResponse(BaseModel):
    analysis_id: str
    status: str
    progress: int
    current_frame: Optional[int] = None
    total_frames: Optional[int] = None
    failure_reason: Optional[str] = None


# ---------------------------------------------------------------------------
# Full analysis result
# ---------------------------------------------------------------------------


class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    video: Optional[VideoMetaSchema] = None
    results: Optional[ResultsSchema] = None
    files: Optional[FilesSchema] = None
    failure_reason: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


class ErrorResponse(BaseModel):
    error: str
    message: str
