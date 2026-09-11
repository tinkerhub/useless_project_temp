"""SQLAlchemy ORM model for the analyses table."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.database.database import Base


class AnalysisModel(Base):
    """
    Persists one row per submitted video analysis.

    Matches the schema defined in docs/BACKEND.md §25.
    """

    __tablename__ = "analyses"

    # Identity
    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    video_path = Column(String, nullable=False)

    # Video metadata
    fps = Column(Float, nullable=True)
    duration = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    total_frames = Column(Integer, nullable=True)

    # Lifecycle
    status = Column(String, nullable=False, default="queued")
    progress = Column(Integer, nullable=False, default=0)
    failure_reason = Column(String, nullable=True)

    # Primary metrics
    rpm = Column(Float, nullable=True)
    center_accuracy = Column(Float, nullable=True)
    wobble_percent = Column(Float, nullable=True)

    # Supporting metrics
    average_velocity = Column(Float, nullable=True)
    peak_velocity = Column(Float, nullable=True)
    average_acceleration = Column(Float, nullable=True)
    peak_acceleration = Column(Float, nullable=True)
    tracking_confidence = Column(Float, nullable=True)
    rotations = Column(Integer, nullable=True)

    # Aggregate score (optional)
    overall_score = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)
