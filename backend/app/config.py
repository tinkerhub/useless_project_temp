"""
Backend configuration for Quantum Pen Flip Predictor.
All tuneable constants and environment-driven settings live here.
"""

import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent          # backend/
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
PROCESSED_DIR = STORAGE_DIR / "processed"
DB_PATH = BASE_DIR / "analysis.db"

# Create storage directories on import (safe no-op if they already exist)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Upload constraints
# ---------------------------------------------------------------------------
MAX_UPLOAD_BYTES: int = int(os.getenv("MAX_UPLOAD_BYTES", str(500 * 1024 * 1024)))  # 500 MB
ALLOWED_EXTENSIONS: set[str] = {"mp4", "mov", "avi", "mkv", "webm"}

# ---------------------------------------------------------------------------
# Computer-vision tuning
# ---------------------------------------------------------------------------
# HSV pen-marker detection range (neon/highly-saturated colour, e.g. green)
PEN_HSV_LOWER = (35, 100, 100)   # lower bound (H, S, V)
PEN_HSV_UPPER = (85, 255, 255)   # upper bound
PEN_MIN_CONTOUR_AREA: int = int(os.getenv("PEN_MIN_CONTOUR_AREA", "50"))

# Maximum consecutive frames without a pen detection before interpolation
# switches to "tracking_lost"
MAX_OCCLUDED_FRAMES: int = int(os.getenv("MAX_OCCLUDED_FRAMES", "30"))

# MediaPipe hand landmark index used as the rotation centre.
# 9 = Middle-Finger MCP — stable reference at the base of the middle finger.
ROTATION_CENTER_LANDMARK: int = int(os.getenv("ROTATION_CENTER_LANDMARK", "9"))

# ---------------------------------------------------------------------------
# Center-accuracy tolerance
# ---------------------------------------------------------------------------
# Maximum allowable distance (pixels) from the ideal rotation centre for a
# 100 % accuracy score.  Set via env var to allow per-video calibration.
D_MAX_PIXELS: float = float(os.getenv("D_MAX_PIXELS", "100.0"))

# ---------------------------------------------------------------------------
# Overall technique score weights
# ---------------------------------------------------------------------------
# The score is: w_rpm * S_rpm + w_center * S_center + w_stability * S_stability
# All weights must sum to 1.
SCORE_WEIGHT_RPM: float = float(os.getenv("SCORE_WEIGHT_RPM", "0.30"))
SCORE_WEIGHT_CENTER: float = float(os.getenv("SCORE_WEIGHT_CENTER", "0.40"))
SCORE_WEIGHT_STABILITY: float = float(os.getenv("SCORE_WEIGHT_STABILITY", "0.30"))

# Max RPM expected (for normalising the RPM sub-score to 0-100)
MAX_EXPECTED_RPM: float = float(os.getenv("MAX_EXPECTED_RPM", "1200.0"))

# ---------------------------------------------------------------------------
# CORS (for local development with the React frontend)
# ---------------------------------------------------------------------------
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
).split(",")
