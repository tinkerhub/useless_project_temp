"""
Bounding-box kinetics: velocity and acceleration.

Algorithm (docs/BACKEND.md §14, docs/PRD.md §5):

  Position:    P_i = (x_i, y_i)
  Velocity:    v_i = (P_i - P_{i-1}) / Δt   (pixels/second)
  Acceleration: a_i = (v_i - v_{i-1}) / Δt  (pixels/second²)
"""

from __future__ import annotations

from typing import List, Tuple

import numpy as np


def compute_kinetics(
    pen_positions: List[Tuple[float, float]],
    timestamps: List[float],
) -> Tuple[float, float, float, float]:
    """
    Derive velocity and acceleration statistics from position + time data.

    Parameters
    ----------
    pen_positions : list of (x, y) pen-centre coordinates.
    timestamps    : list of frame timestamps in seconds (same length).

    Returns
    -------
    (average_velocity, peak_velocity, average_acceleration, peak_acceleration)
    All values in pixels/second or pixels/second².
    """
    if len(pen_positions) < 2:
        return 0.0, 0.0, 0.0, 0.0

    positions = np.array(pen_positions, dtype=float)
    times = np.array(timestamps, dtype=float)

    # Velocity magnitudes (pixels / second)
    dpos = np.diff(positions, axis=0)
    dt = np.diff(times)
    dt_safe = np.where(dt > 0, dt, 1e-9)  # avoid division by zero

    vel_vectors = dpos / dt_safe[:, np.newaxis]
    vel_magnitudes = np.linalg.norm(vel_vectors, axis=1)

    avg_vel = float(np.mean(vel_magnitudes))
    peak_vel = float(np.max(vel_magnitudes))

    # Acceleration magnitudes (pixels / second²)
    if len(vel_magnitudes) < 2:
        return round(avg_vel, 4), round(peak_vel, 4), 0.0, 0.0

    dvel = np.diff(vel_magnitudes)
    dt2 = dt_safe[:-1]  # Δt between acceleration steps
    acc_magnitudes = np.abs(dvel / dt2)

    avg_acc = float(np.mean(acc_magnitudes))
    peak_acc = float(np.max(acc_magnitudes))

    return (
        round(avg_vel, 4),
        round(peak_vel, 4),
        round(avg_acc, 4),
        round(peak_acc, 4),
    )
