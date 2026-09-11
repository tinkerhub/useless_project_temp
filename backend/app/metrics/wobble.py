"""
Wobble calculation — radial RMS deviation of the pen path.

Algorithm (docs/BACKEND.md §17, docs/PRD.md §8):

  For each tracked frame i:
      r_i = sqrt((x_i - x_c)² + (y_i - y_c)²)

  Average radius:
      r̄ = (1/N) Σ r_i

  RMS wobble:
      W = sqrt((1/N) Σ (r_i - r̄)²)

  Normalised wobble percentage:
      Wobble% = (W / r̄) × 100

Lower values → more stable spin.
"""

from __future__ import annotations

from typing import List, Tuple

import numpy as np


def compute_wobble(
    pen_positions: List[Tuple[float, float]],
    rotation_center: Tuple[float, float],
) -> Tuple[float, float]:
    """
    Compute RMS wobble and normalised wobble percentage.

    Parameters
    ----------
    pen_positions   : list of (x, y) pen-centre coordinates.
    rotation_center : (x_c, y_c) rotation reference point.

    Returns
    -------
    (W, wobble_percent)
        W             : absolute RMS wobble in pixels.
        wobble_percent: normalised % (lower = more stable).
    """
    if len(pen_positions) < 2:
        return 0.0, 0.0

    x_c, y_c = rotation_center
    radii = np.array([
        np.sqrt((x - x_c) ** 2 + (y - y_c) ** 2)
        for x, y in pen_positions
    ])

    r_mean = float(np.mean(radii))
    if r_mean == 0:
        return 0.0, 0.0

    W = float(np.sqrt(np.mean((radii - r_mean) ** 2)))
    wobble_percent = round((W / r_mean) * 100, 2)
    return round(W, 4), wobble_percent
