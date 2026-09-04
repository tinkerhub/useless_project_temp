import time

class SequenceDetector:

    def __init__(self, required_frames=8, cooldown=0.7):

        # Gesture currently being checked
        self.candidate_gesture = None
        self.candidate_count = 0

        # Last gesture successfully recorded
        self.current_gesture = None

        # Password gesture sequence
        self.sequence = []

        # Stability settings
        self.required_frames = required_frames
        self.cooldown = cooldown

        # Time when the last gesture was recorded
        self.last_change_time = 0

    def update(self, gesture):

        # NEUTRAL is only a resting state.
        # It should never be part of the password.
        if gesture == "NEUTRAL":
            return self.sequence

        current_time = time.time()

        # Prevent another gesture from being recorded
        # immediately after the previous one.
        if current_time - self.last_change_time < self.cooldown:
            return self.sequence

        # Same gesture as the current candidate
        if gesture == self.candidate_gesture:

            self.candidate_count += 1

        else:

            # A new gesture candidate has appeared
            self.candidate_gesture = gesture
            self.candidate_count = 1

        # Gesture has remained stable for enough frames
        if self.candidate_count >= self.required_frames:

            # Don't record the same gesture twice in a row
            if gesture != self.current_gesture:

                self.current_gesture = gesture
                self.sequence.append(gesture)

                self.last_change_time = current_time

                # Reset stability counter
                self.candidate_count = 0

        return self.sequence

    def reset(self):

        self.candidate_gesture = None
        self.candidate_count = 0
        self.current_gesture = None
        self.sequence = []
        self.last_change_time = 0