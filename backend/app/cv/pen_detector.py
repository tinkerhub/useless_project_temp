"""
Pen detection via HSV colour thresholding.

Pipeline (docs/BACKEND.md §10):
  Frame → BGR→HSV → colour threshold → mask → noise removal
        → contour detection → candidate selection → pen bounding box

The pen must carry a clearly detectable neon/saturated colour marker
(docs/PRD.md §3).  HSV ranges are configured in config.py and are
overridable via environment variables.
"""

from __future__ import annotations

from typing import Optional, Tuple

import cv2
import numpy as np

from app.config import PEN_HSV_LOWER, PEN_HSV_UPPER, PEN_MIN_CONTOUR_AREA

# Type alias: bounding box (x, y, w, h) or None
BoundingBox = Optional[Tuple[int, int, int, int]]


def detect_pen(frame: np.ndarray) -> Tuple[BoundingBox, float]:
    """
    Detect the pen in a single BGR video frame.

    Returns
    -------
    (bounding_box, confidence)
        bounding_box : (x, y, w, h) or None if no pen detected.
        confidence   : 0.0–1.0 detection confidence based on contour clarity.
    """
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    lower = np.array(PEN_HSV_LOWER, dtype=np.uint8)
    upper = np.array(PEN_HSV_UPPER, dtype=np.uint8)
    mask = cv2.inRange(hsv, lower, upper)

    # Noise removal
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return None, 0.0

    # Select the largest contour above the minimum area threshold
    valid = [c for c in contours if cv2.contourArea(c) >= PEN_MIN_CONTOUR_AREA]
    if not valid:
        return None, 0.0

    best = max(valid, key=cv2.contourArea)
    area = cv2.contourArea(best)
    x, y, w, h = cv2.boundingRect(best)

    # Confidence heuristic: ratio of contour fill inside its bounding box
    bbox_area = max(w * h, 1)
    confidence = min(1.0, area / bbox_area)

    return (x, y, w, h), round(confidence, 3)


def bounding_box_center(bbox: Tuple[int, int, int, int]) -> Tuple[float, float]:
    """
    Return the geometric centre of a bounding box.

    (docs/BACKEND.md §11): x_p = x + w/2,  y_p = y + h/2
    """
    x, y, w, h = bbox
    return x + w / 2, y + h / 2
