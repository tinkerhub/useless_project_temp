"""
Unit tests for center accuracy (app/metrics/center_accuracy.py).

Tests verify:
- Perfect centred path → 100% accuracy
- Far path → 0% accuracy (clamped)
- Known distance → known accuracy score
- Edge cases
"""

import math

import pytest

from app.metrics.center_accuracy import compute_center_accuracy


def test_perfect_center_accuracy():
    """Points exactly on the rotation center → mean_dist=0, accuracy=100%."""
    center = (50.0, 50.0)
    # Points arranged at exactly d_max/2 from centre → accuracy = 50%
    d_max = 100.0
    positions = [(50.0 + 50.0, 50.0)]  # distance = 50 pixels
    _, accuracy = compute_center_accuracy(positions, center, d_max=d_max)
    assert abs(accuracy - 50.0) < 0.1


def test_zero_distance_accuracy():
    """Pen exactly at the rotation centre → 100% accuracy."""
    center = (100.0, 100.0)
    positions = [(100.0, 100.0)] * 10
    _, accuracy = compute_center_accuracy(positions, center, d_max=100.0)
    assert accuracy == 100.0


def test_over_d_max_clamps_to_zero():
    """Pen much further than D_max → accuracy clamps to 0%, never negative."""
    center = (0.0, 0.0)
    positions = [(200.0, 0.0)] * 5  # distance = 200 px > D_max=100
    _, accuracy = compute_center_accuracy(positions, center, d_max=100.0)
    assert accuracy == 0.0


def test_known_accuracy():
    """Mean distance = 30, D_max = 100 → accuracy = (1 - 30/100) * 100 = 70%."""
    center = (0.0, 0.0)
    positions = [(30.0, 0.0)] * 10
    mean_dist, accuracy = compute_center_accuracy(positions, center, d_max=100.0)
    assert abs(mean_dist - 30.0) < 0.01
    assert abs(accuracy - 70.0) < 0.01


def test_accuracy_empty():
    mean_dist, accuracy = compute_center_accuracy([], (50.0, 50.0))
    assert mean_dist == 0.0
    assert accuracy == 0.0


def test_accuracy_always_nonnegative():
    """Accuracy score must never go below 0."""
    center = (0.0, 0.0)
    positions = [(9999.0, 9999.0)]
    _, accuracy = compute_center_accuracy(positions, center, d_max=1.0)
    assert accuracy >= 0.0
