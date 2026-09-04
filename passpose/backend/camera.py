import cv2


def main():
    # Open the default webcam
    camera = cv2.VideoCapture(0)

    # Check if webcam opened successfully
    if not camera.isOpened():
        print("Error: Could not open webcam.")
        return

    while True:
        # Read one frame from the webcam
        success, frame = camera.read()

        if not success:
            print("Error: Could not read frame.")
            break

        # Display the frame
        cv2.imshow("PassPose Camera", frame)

        # Press Q to quit
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    # Release the webcam
    camera.release()

    # Close all OpenCV windows
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()