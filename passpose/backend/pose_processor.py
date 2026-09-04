import cv2
import mediapipe as mp

from .gesture_detector import detect_gesture


MODEL_PATH = "passpose/backend/models/pose_landmarker_full.task"


class PoseProcessor:

    def __init__(self):

        base_options = mp.tasks.BaseOptions(
            model_asset_path=MODEL_PATH
        )

        options = mp.tasks.vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=mp.tasks.vision.RunningMode.VIDEO,
            num_poses=1
        )

        self.landmarker = (
            mp.tasks.vision.PoseLandmarker.create_from_options(
                options
            )
        )

        self.frame_timestamp = 0

    def process_frame(self, frame):

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        result = self.landmarker.detect_for_video(
            mp_image,
            self.frame_timestamp
        )

        self.frame_timestamp += 1

        if not result.pose_landmarks:
            return None

        landmarks = result.pose_landmarks[0]

        gesture = detect_gesture(landmarks)

        return gesture

    def close(self):

        self.landmarker.close()