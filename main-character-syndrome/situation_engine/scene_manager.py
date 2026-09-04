import time


class SceneManager:
    def __init__(self):
        self.current_scene = None
        self.last_change_time = 0
        self.cooldowns = {
            "default": 3.5,
            "high": 0.0,
            "medium": 3.5,
        }

    def update_scene(self, scene_name: str | None, priority: str = "medium", confidence: float = 0.8):
        now = time.time()
        if not scene_name:
            return self.current_scene

        if self.current_scene is None:
            self.current_scene = scene_name
            self.last_change_time = now
            return self.current_scene

        if priority == "high":
            self.current_scene = scene_name
            self.last_change_time = now
            return self.current_scene

        if confidence < 0.5:
            return self.current_scene

        elapsed = now - self.last_change_time
        if elapsed >= self.cooldowns.get(priority, 3.5):
            self.current_scene = scene_name
            self.last_change_time = now
        return self.current_scene
