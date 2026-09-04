import cv2

from .auth_controller import AuthController


controller = AuthController()

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Error: Could not open webcam.")
    controller.close()
    exit()

print()
print("=== PASSPOSE CONTROLLER TEST ===")
print("Press C to record a password.")
print("Press V to verify a password.")
print("Press SPACE to finish.")
print("Press Q to quit.")
print()

recording = False
verifying = False

while True:

    success, frame = camera.read()

    if not success:
        print("Error: Could not read frame.")
        break

    gesture, sequence = controller.process_frame(frame)

    if gesture:
        cv2.putText(
            frame,
            f"Gesture: {gesture}",
            (20, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

    cv2.putText(
        frame,
        f"Sequence: {' -> '.join(sequence)}",
        (20, 90),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2
    )

    if recording:
        cv2.putText(
            frame,
            "RECORDING PASSWORD",
            (20, 130),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),
            2
        )

    elif verifying:
        cv2.putText(
            frame,
            "VERIFYING PASSWORD",
            (20, 130),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),
            2
        )

    cv2.imshow("PassPose Authentication Controller", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break

    elif key == ord("c"):
        controller.start_recording()

        recording = True
        verifying = False

        print()
        print("=== RECORDING ===")
        print("Perform your secret pose sequence.")
        print("Press SPACE when finished.")

    elif key == ord("v"):
        controller.reset_sequence()

        recording = False
        verifying = True

        print()
        print("=== VERIFICATION ===")
        print("Perform your saved pose sequence.")
        print("Press SPACE when finished.")

    elif key == ord(" ") and recording:

        recording = False

        success = controller.save_recorded_password()

        print()
        print("Recorded sequence:")
        print(controller.sequence_detector.sequence)

        if success:
            print("Password saved successfully!")
        else:
            print("Could not save password.")

    elif key == ord(" ") and verifying:

        verifying = False

        result = controller.verify_recorded_sequence()

        print()
        print("Entered sequence:")
        print(controller.sequence_detector.sequence)

        if result:
            print("ACCESS GRANTED!")
        else:
            print("ACCESS DENIED!")


camera.release()
controller.close()
cv2.destroyAllWindows()