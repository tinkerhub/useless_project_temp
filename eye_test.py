import os
os.environ["MEDIAPIPE_GPU"] = "0"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import cv2
import mediapipe as mp
import numpy as np
import time

print("[1/3] Setting up camera via AVFoundation...")
cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)

time.sleep(0.5)

if not cap.isOpened():
    print("[Error] Could not open camera. Please check macOS Privacy permissions.")
    exit(1)

print("[2/3] Loading MediaPipe FaceMesh...")
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]

def get_ear(landmarks, indices, w, h):
    pts = np.array([(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in indices])
    d_v1 = np.linalg.norm(pts[1] - pts[5])
    d_v2 = np.linalg.norm(pts[2] - pts[4])
    d_h = np.linalg.norm(pts[0] - pts[3])
    return (d_v1 + d_v2) / (2.0 * d_h) if d_h > 0 else 0.0

EAR_THRESHOLD = 0.22
CLOSE_FRAMES_REQUIRED = 20  # ~1.0 to 1.5 seconds of holding eyes closed
consecutive_closed = 0

print("[3/3] Running! Close both eyes to authenticate and close webcam, or press 'q'.")

try:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret or frame is None:
            if cv2.waitKey(10) & 0xFF in [ord('q'), 27]:
                break
            continue

        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape

        # FIX: Ensure contiguous C-ordered uint8 array and DO NOT set flags.writeable = False
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb = np.ascontiguousarray(rgb, dtype=np.uint8)

        results = face_mesh.process(rgb)

        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            l_ear = get_ear(landmarks, LEFT_EYE, w, h)
            r_ear = get_ear(landmarks, RIGHT_EYE, w, h)
            avg_ear = (l_ear + r_ear) / 2.0

            if avg_ear < EAR_THRESHOLD:
                consecutive_closed += 1
            else:
                consecutive_closed = 0

            # Progress bar calculation
            progress = min(1.0, consecutive_closed / CLOSE_FRAMES_REQUIRED)
            bar_w = int(progress * 200)

            # Visual HUD
            cv2.putText(frame, f"EAR: {avg_ear:.2f}", (20, 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, "Hold eyes closed to authenticate", (20, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            
            # Progress bar
            cv2.rectangle(frame, (20, 85), (220, 105), (100, 100, 100), 2)
            cv2.rectangle(frame, (20, 85), (20 + bar_w, 105), (0, 255, 0), -1)

            # Auto-close condition
            if consecutive_closed >= CLOSE_FRAMES_REQUIRED:
                print("\n==============================================")
                print("[SUCCESS] Pattern authenticated! Shutting down...")
                print("==============================================")
                cv2.putText(frame, "ACCESS GRANTED! CLOSING...", (20, 150),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 3)
                cv2.imshow("Eye Pattern Auth", frame)
                cv2.waitKey(600)
                break

        cv2.imshow("Eye Pattern Auth", frame)
        if cv2.waitKey(10) & 0xFF in [ord('q'), 27]:
            print("\n[Status] Quit via keypress.")
            break

except KeyboardInterrupt:
    print("\n[Status] Interrupted by terminal.")
finally:
    print("[Status] Powering down camera hardware...")
    cap.release()
    face_mesh.close()
    cv2.destroyAllWindows()
    for _ in range(10):
        cv2.waitKey(1)
    print("[Status] Camera stopped cleanly.")
