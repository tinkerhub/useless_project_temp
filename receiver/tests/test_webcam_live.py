import cv2

print("OpenCV version:", cv2.__version__)

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("ERROR: Could not open webcam.")
    raise SystemExit(1)

print("Webcam opened successfully.")
print("Press Q to quit.")

while True:
    success, frame = camera.read()

    if not success:
        print("ERROR: Failed to read frame.")
        break

    cv2.imshow("Receiver Webcam Test", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

camera.release()
cv2.destroyAllWindows()

print("Webcam test finished successfully.")