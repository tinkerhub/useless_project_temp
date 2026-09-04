import math


class MotionDetector:

    def __init__(self):
        self.previous_angle = None
        self.rotation_count = 0

    def update(self, landmarks):

        left_wrist = landmarks[15]
        right_wrist = landmarks[16]

        dx = right_wrist.x - left_wrist.x
        dy = right_wrist.y - left_wrist.y

        angle = math.atan2(dy, dx)

        if self.previous_angle is not None:

            angle_change = angle - self.previous_angle

            # Handle angle wrapping
            if angle_change > math.pi:
                angle_change -= 2 * math.pi

            elif angle_change < -math.pi:
                angle_change += 2 * math.pi

            if abs(angle_change) > 0.15:
                self.rotation_count += 1

        self.previous_angle = angle

        if self.rotation_count >= 8:
            self.rotation_count = 0
            return True

        return False

    def reset(self):
        self.previous_angle = None
        self.rotation_count = 0