class EventDetector:
    def detect(self, activity: dict | None = None, context: dict | None = None):
        activity = activity or {"name": "walking", "confidence": 0.8}
        context = context or {"movement_speed": 0.7, "movement_intensity": 0.8, "sudden_velocity_change": 0.5, "head_stability": 0.7}

        if context.get("sudden_velocity_change", 0) > 0.75:
            return {"name": "sudden_movement", "confidence": 0.9, "duration": 1.1}

        if activity["name"] in {"walking", "running"} and context.get("movement_speed", 0) > 0.8:
            return {"name": "rapid_movement", "confidence": 0.85, "duration": 2.2}

        if activity["name"] == "standing_still" and context.get("movement_speed", 0) < 0.2 and context.get("head_stability", 0) > 0.8 and context.get("activity_duration", 0) > 4:
            return {"name": "possible_zone_out", "confidence": 0.88, "duration": 5.0}

        if context.get("movement_intensity", 0) > 0.9 and context.get("sudden_velocity_change", 0) > 0.6:
            return {"name": "chaos", "confidence": 0.84, "duration": 1.8}

        if activity["name"] == "standing_still" and context.get("movement_speed", 0) < 0.15:
            return {"name": "dramatic_freeze", "confidence": 0.82, "duration": 1.4}

        return {"name": "subtle_movement", "confidence": 0.52, "duration": 0.9}
