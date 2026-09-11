"""
Center accuracy calculation.

Algorithm (docs/BACKEND.md §16, docs/PRD.md §7):

  Distance of pen from rotation centre, frame i:
      D_i = sqrt((x_i - x_c)² + (y_i - y_c)²)

  Average distance:
      D̄ = (1/N) Σ D_i

  Normalised accuracy score (0–100, clamped to 0):
      Accuracy = max(0, 1 - D̄ / D_max) × 100

D_max is configurable (see config.py) — not hard-coded.
"""

from __future__ import annotations

from typing import List, Tuple

import numpy as np

from app.config import D_MAX_PIXELS


def compute_center_accuracy(
    pen_positions: List[Tuple[float, float]],
    rotation_center: Tuple[float, float],
    d_max: float = D_MAX_PIXELS,
) -> Tuple[float, float]:
    """
    Compute average pen-to-centre distance and normalised accuracy score.

    Parameters
    ----------
    pen_positions   : list of (x, y) pen-centre coordinates.
    rotation_center : (x_c, y_c) reference point.
    d_max           : maximum tolerable distance for 0 % accuracy (pixels).

    Returns
    -------
    (mean_distance_pixels, accuracy_percent)
    """
    if not pen_positions:
        return 0.0, 0.0

    x_c, y_c = rotation_center
    distances = np.array([
        np.sqrt((x - x_c) ** 2 + (y - y_c) ** 2)
        for x, y in pen_positions
    ])

    mean_dist = float(np.mean(distances))
    accuracy = max(0.0, 1.0 - mean_dist / d_max) * 100.0
    return round(mean_dist, 4), round(accuracy, 2)
