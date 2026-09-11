"""
Result aggregation and overall technique score.

Aggregates metric outputs from individual calculation modules into the
canonical result structure (docs/TEAM_SHARED_CONTRACT.md §7).

Overall score formula (docs/BACKEND.md §22, config.py weights):
  Score = w_rpm * S_rpm + w_center * S_center + w_stability * S_stability

where:
  S_rpm       = min(100, rpm / MAX_EXPECTED_RPM * 100)
  S_center    = center_accuracy (already 0–100)
  S_stability = max(0, 100 - wobble_percent)
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config import (
    MAX_EXPECTED_RPM,
    SCORE_WEIGHT_CENTER,
    SCORE_WEIGHT_RPM,
    SCORE_WEIGHT_STABILITY,
)


@dataclass
class AggregatedResult:
    rpm: float
    center_accuracy: float
    wobble_percent: float
    average_velocity: float
    peak_velocity: float
    average_acceleration: float
    peak_acceleration: float
    tracking_confidence: float
    rotations: int
    overall_score: float


def aggregate_results(
    rpm: float,
    rotations: int,
    center_accuracy: float,
    wobble_percent: float,
    avg_velocity: float,
    peak_velocity: float,
    avg_acceleration: float,
    peak_acceleration: float,
    tracking_confidence: float,
) -> AggregatedResult:
    """
    Combine individual metric values into an AggregatedResult.

    Returns
    -------
    AggregatedResult with all canonical fields populated.
    """
    # Sub-scores (0–100)
    s_rpm = min(100.0, (rpm / MAX_EXPECTED_RPM) * 100.0)
    s_center = max(0.0, min(100.0, center_accuracy))
    s_stability = max(0.0, 100.0 - wobble_percent)

    overall = (
        SCORE_WEIGHT_RPM * s_rpm
        + SCORE_WEIGHT_CENTER * s_center
        + SCORE_WEIGHT_STABILITY * s_stability
    )

    return AggregatedResult(
        rpm=rpm,
        center_accuracy=center_accuracy,
        wobble_percent=wobble_percent,
        average_velocity=avg_velocity,
        peak_velocity=peak_velocity,
        average_acceleration=avg_acceleration,
        peak_acceleration=peak_acceleration,
        tracking_confidence=tracking_confidence,
        rotations=rotations,
        overall_score=round(overall, 1),
    )
