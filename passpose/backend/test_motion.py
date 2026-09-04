import cv2
import mediapipe as mp

from motion_detector import MotionDetector


MODEL_PATH = "passpose/backend/models/pose_landmarker_full.task"


# Create MediaPipe pose detector
base_options = mp.tasks.BaseOptions(
    model_asset_path=MODEL_PATH
)

options = mp.tasks.vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=mp.tasks.vision.RunningMode.VIDEO,
    num_poses=1
)

landmarker = mp.tasks.vision.PoseLandmarker.create_from_options(options)

motion_detector = MotionDetector()

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Error: Could not open webcam.")
    landmarker.close()
    exit()


frame_timestamp = 0

while True:

    success, frame = camera.read()

    if not success:
        print("Error: Could not read frame.")
        break

    # Convert OpenCV BGR → RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame
    )

    # Detect pose
    result = landmarker.detect_for_video(
        mp_image,
        frame_timestamp
    )

    frame_timestamp += 1

    if result.pose_landmarks:

        landmarks = result.pose_landmarks[0]

        # Check for disco roll movement
        disco_detected = motion_detector.update(landmarks)

        if disco_detected:

            cv2.putText(
                frame,
                "DISCO ROLL!",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                3
            )

            print("Disco roll detected!")

        else:

            cv2.putText(
                frame,
                "Move your hands!",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2
            )

    else:

        cv2.putText(
            frame,
            "No person detected",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2
        )

    cv2.imshow("PassPose - Motion Test", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break


camera.release()
landmarker.close()
cv2.destroyAllWindows()