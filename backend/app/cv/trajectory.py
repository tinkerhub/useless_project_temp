"""
Trajectory serialisation helpers.

Generates and saves the trajectory.json file used by:
  GET /api/analyses/{id}/trajectory
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Tuple


def build_trajectory_points(
    pen_positions: List[Tuple[float, float]],
    frame_indices: List[int],
) -> List[dict]:
    """
    Build the canonical trajectory point list.

    Each point: {"frame": int, "x": float, "y": float}
    Matches docs/TEAM_SHARED_CONTRACT.md §10.
    """
    return [
        {"frame": frame_indices[i], "x": round(x, 2), "y": round(y, 2)}
        for i, (x, y) in enumerate(pen_positions)
    ]


def save_trajectory(points: List[dict], processed_dir: Path) -> Path:
    """Persist trajectory.json and return its path."""
    processed_dir.mkdir(parents=True, exist_ok=True)
    trajectory_path = processed_dir / "trajectory.json"
    with open(trajectory_path, "w") as f:
        json.dump({"points": points}, f)
    return trajectory_path


def load_trajectory(processed_dir: Path) -> List[dict]:
    """Load trajectory points from stored JSON, or return empty list."""
    trajectory_path = processed_dir / "trajectory.json"
    if not trajectory_path.exists():
        return []
    with open(trajectory_path) as f:
        data = json.load(f)
    return data.get("points", [])
