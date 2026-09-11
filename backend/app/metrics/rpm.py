"""
RPM calculation from frame-by-frame angular tracking.

Algorithm (docs/BACKEND.md §15, docs/PRD.md §6):

  1. For each frame i, compute angle of pen centre P_i relative to
     rotation centre C:

         θ_i = atan2(y_i - y_c, x_i - x_c)

  2. Compute angular displacement with wrapping to (-π, π]:

         Δθ_i = wrap(θ_i - θ_{i-1})

  3. Angular velocity:

         ω_i = Δθ_i / Δt

  4. RPM:

         RPM = (ω / 2π) × 60

RPM is derived from frame timestamps — NOT from wall-clock time.
"""

from __future__ import annotations

import math
from typing import List, Tuple

import numpy as np


def _wrap_angle(delta: float) -> float:
    """Wrap an angular displacement into (-π, π] to handle 359°→0° transitions."""
    while delta > math.pi:
        delta -= 2 * math.pi
    while delta <= -math.pi:
        delta += 2 * math.pi
    return delta


def compute_rpm(
    pen_positions: List[Tuple[float, float]],
    timestamps: List[float],
    rotation_center: Tuple[float, float],
) -> Tuple[float, int]:
    """
    Compute average RPM and rotation count from tracked pen positions.

    Parameters
    ----------
    pen_positions : list of (x, y) pen-centre coordinates, one per frame.
    timestamps    : list of frame timestamps in seconds, same length.
    rotation_center : (x_c, y_c) reference finger/rotation centre.

    Returns
    -------
    (rpm, rotations) where rotations is the total number of complete 360°
    revolutions detected.
    """
    if len(pen_positions) < 2 or len(timestamps) < 2:
        return 0.0, 0

    x_c, y_c = rotation_center

    angles: List[float] = []
    for x, y in pen_positions:
        angles.append(math.atan2(y - y_c, x - x_c))

    # Cumulative angular displacement with wrapping
    cumulative_displacement = 0.0
    angular_velocities: List[float] = []

    for i in range(1, len(angles)):
        dt = timestamps[i] - timestamps[i - 1]
        if dt <= 0:
            continue
        delta_theta = _wrap_angle(angles[i] - angles[i - 1])
        cumulative_displacement += delta_theta
        omega = delta_theta / dt
        angular_velocities.append(omega)

    if not angular_velocities:
        return 0.0, 0

    avg_omega = float(np.mean(angular_velocities))
    avg_rpm = abs(avg_omega / (2 * math.pi)) * 60.0

    # Count complete rotations from cumulative displacement
    rotations = int(abs(cumulative_displacement) / (2 * math.pi))

    return round(avg_rpm, 2), rotations
