"""
Unit tests for wobble calculation (app/metrics/wobble.py).

Tests verify:
- Perfect circle (zero wobble)
- Known wobble from path with measured deviation
- Edge cases
"""

import math

import pytest

from app.metrics.wobble import compute_wobble


def _perfect_circle(center, radius, n_points=100):
    """Generate n points on a perfect circle."""
    x_c, y_c = center
    return [
        (x_c + radius * math.cos(2 * math.pi * i / n_points),
         y_c + radius * math.sin(2 * math.pi * i / n_points))
        for i in range(n_points)
    ]


def test_perfect_circle_zero_wobble():
    """A perfect circular path must produce W=0 and wobble_percent=0."""
    positions = _perfect_circle(center=(100.0, 100.0), radius=50.0)
    W, wobble_pct = compute_wobble(positions, (100.0, 100.0))
    assert W < 1e-6, f"Expected W≈0, got {W}"
    assert wobble_pct < 1e-4, f"Expected wobble%≈0, got {wobble_pct}"


def test_known_wobble():
    """
    Two alternating radii should produce a predictable wobble.

    Radii alternate between 40 and 60 (mean=50, deviation=10).
    W = 10, wobble_pct = 10/50 * 100 = 20%
    """
    center = (0.0, 0.0)
    positions = []
    n = 200
    for i in range(n):
        r = 40.0 if i % 2 == 0 else 60.0
        angle = 2 * math.pi * i / n
        positions.append((r * math.cos(angle), r * math.sin(angle)))

    W, wobble_pct = compute_wobble(positions, center)
    assert abs(W - 10.0) < 0.5, f"Expected W≈10, got {W}"
    assert abs(wobble_pct - 20.0) < 1.0, f"Expected wobble%≈20, got {wobble_pct}"


def test_wobble_empty():
    W, wobble_pct = compute_wobble([], (50.0, 50.0))
    assert W == 0.0
    assert wobble_pct == 0.0


def test_wobble_single_point():
    W, wobble_pct = compute_wobble([(70.0, 70.0)], (50.0, 50.0))
    # Single point has zero deviation
    assert wobble_pct == 0.0


def test_wobble_nonnegative():
    """Wobble percent must always be >= 0."""
    positions = _perfect_circle(center=(0.0, 0.0), radius=30.0, n_points=50)
    _, wobble_pct = compute_wobble(positions, (0.0, 0.0))
    assert wobble_pct >= 0.0
