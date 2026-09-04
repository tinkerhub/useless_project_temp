class ContextAnalyzer:
    def __init__(self, history=None):
        self.history = history or []

    def analyze(self, payload: dict | None = None, activity: dict | None = None):
        payload = payload or {}
        activity = activity or {"name": "walking", "confidence": 0.8}

        movement_speed = payload.get("movement_speed", 0.72)
        movement_intensity = payload.get("movement_intensity", 0.8)
        posture = payload.get("posture", "upright")
        activity_duration = payload.get("activity_duration", 4.1)
        head_stability = payload.get("head_stability", 0.8)
        sudden_velocity_change = payload.get("sudden_velocity_change", 0.62)
        time_context = payload.get("time_context", "evening")

        if activity["name"] == "standing_still":
            movement_speed *= 0.35
            movement_intensity *= 0.45

        return {
            "movement_speed": float(movement_speed),
            "movement_intensity": float(movement_intensity),
            "posture": posture,
            "activity_duration": float(activity_duration),
            "head_stability": float(head_stability),
            "sudden_velocity_change": float(sudden_velocity_change),
            "time_context": time_context,
        }
