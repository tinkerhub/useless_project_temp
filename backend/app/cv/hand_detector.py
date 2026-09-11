"""
Hand/finger detection and rotation-centre extraction via MediaPipe Hands.

Pipeline (docs/BACKEND.md §12):
  Frame → MediaPipe Hands → hand landmarks → specific landmark → C = (x_c, y_c)

Decision: Landmark index 9 (Middle Finger MCP) is used as the rotation centre.
This is a stable, hardware-independent landmark at the base of the middle finger.
Fallback: palm centroid computed from landmarks 0, 5, 9, 13, 17.

Note: MediaPipe availability is checked at import time.  On systems where
Windows Application Control blocks matplotlib's DLL (which mediapipe pulls in),
the detector will silently return None for every frame.  The tracker treats a
missing rotation centre as a fallback to the pen-path centroid.
"""

from __future__ import annotations

from typing import Any, Optional, Tuple

import cv2
import numpy as np

from app.config import ROTATION_CENTER_LANDMARK

# --------------------------------------------------------------------------
# Attempt to import mediapipe.  On some Windows machines, a system-level
# Application Control policy blocks matplotlib's compiled DLL which mediapipe
# 1.0.x imports transitively.  We degrade gracefully rather than crashing.
# --------------------------------------------------------------------------
try:
    import mediapipe as mp  # type: ignore[import-untyped]
    _mp_hands_module = mp.solutions.hands
    _MEDIAPIPE_AVAILABLE = True
except Exception:
    _mp_hands_module = None
    _MEDIAPIPE_AVAILABLE = False


# Singleton instance — initialised lazily
_hands_detector: Optional[Any] = None


def _get_detector() -> Optional[Any]:
    """Return singleton Hands detector, or None if mediapipe is unavailable."""
    global _hands_detector
    if not _MEDIAPIPE_AVAILABLE:
        return None
    if _hands_detector is None:
        _hands_detector = _mp_hands_module.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
    return _hands_detector


def detect_rotation_center(frame: np.ndarray) -> Optional[Tuple[float, float]]:
    """
    Detect the rotation centre from the hand in the frame.

    Returns
    -------
    (x_c, y_c) in pixel coordinates, or None if no hand is visible
    or mediapipe is unavailable.
    """
    detector = _get_detector()
    if detector is None:
        return None

    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = detector.process(rgb)

    if not results.multi_hand_landmarks:
        return None

    landmarks = results.multi_hand_landmarks[0].landmark

    # Primary: use the configured landmark index
    if ROTATION_CENTER_LANDMARK < len(landmarks):
        lm = landmarks[ROTATION_CENTER_LANDMARK]
        return lm.x * w, lm.y * h

    # Fallback: palm centroid
    palm_indices = [0, 5, 9, 13, 17]
    xs = [landmarks[i].x * w for i in palm_indices if i < len(landmarks)]
    ys = [landmarks[i].y * h for i in palm_indices if i < len(landmarks)]
    if xs:
        return float(np.mean(xs)), float(np.mean(ys))

    return None


def close_detector() -> None:
    """Release MediaPipe resources. Call on application shutdown."""
    global _hands_detector
    if _hands_detector is not None:
        _hands_detector.close()
        _hands_detector = None
