from __future__ import annotations

from math import hypot


class ActivityDetector:
    """Very lightweight pose-based activity detection with graceful fallback."""

    def detect(self, payload: dict | None = None):
        payload = payload or {}
        landmarks = payload.get("landmarks") or []
        movement = payload.get("movement")
        action_hint = payload.get("activity")

        if not landmarks and action_hint:
            activity_name = action_hint
            confidence = payload.get("confidence", 0.8)
            return {"name": activity_name, "confidence": confidence}

        if not landmarks:
            return {"name": "standing_still", "confidence": 0.42}

        if movement is None:
            movement = self._estimate_movement(landmarks)

        if movement > 0.6:
            return {"name": "walking", "confidence": 0.91}
        if movement > 0.35:
            return {"name": "standing_still", "confidence": 0.74}
        if movement > 0.12:
            return {"name": "looking_around", "confidence": 0.7}
        return {"name": "standing_still", "confidence": 0.58}

    @staticmethod
    def _estimate_movement(landmarks):
        if not landmarks:
            return 0.0
        points = [landmarks[i] for i in (11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28) if i < len(landmarks)]
        if not points:
            return 0.0
        total = 0.0
        for p in points:
            x = p.get("x", 0)
            y = p.get("y", 0)
            total += hypot(x, y)
        return min(1.0, total / len(points))
