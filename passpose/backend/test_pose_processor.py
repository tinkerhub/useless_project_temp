import cv2

from .pose_processor import PoseProcessor


processor = PoseProcessor()

camera = cv2.VideoCapture(0)

if not camera.isOpened():

    print("Error: Could not open webcam.")
    processor.close()
    exit()


while True:

    success, frame = camera.read()

    if not success:

        print("Error: Could not read frame.")
        break

    gesture = processor.process_frame(frame)

    if gesture is not None:

        cv2.putText(
            frame,
            f"Gesture: {gesture}",
            (20, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

    else:

        cv2.putText(
            frame,
            "No person detected",
            (20, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2
        )

    cv2.imshow(
        "PassPose - Pose Processor Test",
        frame
    )

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break


camera.release()
processor.close()
cv2.destroyAllWindows()