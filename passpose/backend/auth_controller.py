from .pose_processor import PoseProcessor
from .sequence_detector import SequenceDetector
from .auth_service import create_password, authenticate


class AuthController:

    def __init__(self):
        self.pose_processor = PoseProcessor()
        self.sequence_detector = SequenceDetector()

    def start_recording(self):
        self.sequence_detector.reset()

    def process_frame(self, frame):
        gesture = self.pose_processor.process_frame(frame)

        if gesture is None:
            return None, self.sequence_detector.sequence

        sequence = self.sequence_detector.update(gesture)

        return gesture, sequence

    def save_recorded_password(self):
        sequence = self.sequence_detector.sequence

        if not sequence:
            return False

        return create_password(sequence)

    def verify_recorded_sequence(self):
        sequence = self.sequence_detector.sequence

        if not sequence:
            return False

        return authenticate(sequence)

    def reset_sequence(self):
        self.sequence_detector.reset()

    def close(self):
        self.pose_processor.close()