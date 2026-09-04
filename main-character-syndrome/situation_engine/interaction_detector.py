class InteractionDetector:
    def detect(self, payload: dict | None = None):
        payload = payload or {}
        people_count = payload.get("people_count") or 1
        interaction = payload.get("interaction")
        if interaction is None and people_count > 1:
            interaction = "group_chaos"
        return {
            "people_count": int(people_count),
            "interaction": interaction,
            "experimental": True,
        }
