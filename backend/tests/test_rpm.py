"""
Unit tests for RPM calculation (app/metrics/rpm.py).

Tests verify:
- Correct RPM from a known circular motion
- Angle wrapping correctness (359° → 0° treated as +1°)
- Rotation count detection
- Edge cases: empty input, single frame
"""

import math

import pytest

from app.metrics.rpm import compute_rpm, _wrap_angle


# ---------------------------------------------------------------------------
# Angle wrapping
# ---------------------------------------------------------------------------


def test_wrap_angle_positive():
    """Angle slightly above π wraps to near -π."""
    result = _wrap_angle(math.pi + 0.1)
    assert -math.pi < result <= math.pi


def test_wrap_angle_negative():
    """Angle slightly below -π wraps to near +π."""
    result = _wrap_angle(-math.pi - 0.1)
    assert -math.pi < result <= math.pi


def test_wrap_angle_crossing_zero():
    """359° → 0° should be treated as +1°, not -359°."""
    angle_359 = math.radians(359)
    angle_0 = math.radians(0)
    raw_delta = angle_0 - angle_359           # ≈ -6.265 (wrong)
    wrapped = _wrap_angle(raw_delta)
    expected = math.radians(1)
    assert abs(wrapped - expected) < 1e-6


# ---------------------------------------------------------------------------
# Known circular motion
# ---------------------------------------------------------------------------


def _generate_circular_motion(rpm: float, fps: float, num_revolutions: float):
    """Generate synthetic pen positions for a known RPM."""
    total_frames = int(num_revolutions * fps * 60 / rpm)
    radius = 50.0
    center = (100.0, 100.0)
    positions = []
    timestamps = []
    for i in range(total_frames):
        t = i / fps
        angle = 2 * math.pi * (rpm / 60) * t
        x = center[0] + radius * math.cos(angle)
        y = center[1] + radius * math.sin(angle)
        positions.append((x, y))
        timestamps.append(t)
    return positions, timestamps, center


def test_rpm_exact_circular():
    """A perfect circular motion at 600 RPM should return ≈600 RPM."""
    target_rpm = 600.0
    positions, timestamps, center = _generate_circular_motion(
        rpm=target_rpm, fps=240.0, num_revolutions=5
    )
    computed_rpm, rotations = compute_rpm(positions, timestamps, center)
    assert abs(computed_rpm - target_rpm) < 5.0, (
        f"Expected ~{target_rpm} RPM, got {computed_rpm}"
    )
    assert rotations >= 4  # at least 4 complete rotations detected


def test_rpm_high_fps():
    """RPM computed at 240 FPS should be accurate within 2%."""
    target_rpm = 742.0
    positions, timestamps, center = _generate_circular_motion(
        rpm=target_rpm, fps=240.0, num_revolutions=10
    )
    computed_rpm, _ = compute_rpm(positions, timestamps, center)
    assert abs(computed_rpm - target_rpm) / target_rpm < 0.02


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


def test_rpm_empty_input():
    rpm, rotations = compute_rpm([], [], (0.0, 0.0))
    assert rpm == 0.0
    assert rotations == 0


def test_rpm_single_frame():
    rpm, rotations = compute_rpm([(50.0, 50.0)], [0.0], (100.0, 100.0))
    assert rpm == 0.0
    assert rotations == 0
