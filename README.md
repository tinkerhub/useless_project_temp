<img width="3188" height="1202" alt="frame (3)" src="https://github.com/user-attachments/assets/517ad8e9-ad22-457d-9538-a9e62d137cd7" />


# Face it 🎯


## Basic Details
### Team Name: B200's


### Team Members
- Team Lead: Joshua Joseph - TKMCE
- Member 2: Jeff Jacob Mathew - TKMCE


### Project Description
Our project is a creative, and useless hands-free system that enables users to control their mouse using their nose, left click by slightly opening your mouth, or just take a screenshot by closing both your eyes, and all this captured via a webcam. It leverages MediaPipe Face Mesh and OpenCV for real-time facial landmark detection and PyAutoGUI for mouse interactions. We used MediaPipe Face Mesh to track facial landmarks in real-time, OpenCV to process camera input, and PyAutoGUI to perform mouse and screenshot actions. This system runs entirely using a webcam and Python, turning your face into a multitool of questionable practicality.

### The Problem (that doesn't exist)
To move a mouse without touching and control your laptop.

### The Solution (that nobody asked for)
To control your laptop with your nose.
## Technical Details
### Technologies/Components Used
For Software:
- Python
- MediaPipe  
- openCV,pyautogui,mediapipe
- Visual Studio Code , Webcam

For Hardware:
- Webcam
- Laptop
- Mouse Pointer (Virtual)

### Implementation
For Software:
# Installation
pip install opencv-python mediapipe pyautogui

# Run
python NoseControlledMouse.py

### Project Documentation
For Software:

# Screenshots (Add at least 3)
<img width="1918" height="1017" alt="SS1" src="https://github.com/user-attachments/assets/1eeea729-fd91-482b-86ef-0eefe695aa7c" />
Initial Coding.
Imports necessary libraries: OpenCV, MediaPipe, PyAutoGUI, etc.
Initializes MediaPipe FaceMesh for facial landmark detection.
Fetches screen size using PyAutoGUI.
Sets flags to manage gesture states (clicking, blinking, etc.).
Starts webcam capture using OpenCV.


<img width="1918" height="1018" alt="SS2" src="https://github.com/user-attachments/assets/cf9ce18d-63fa-482e-8e62-60d193846ede" />
The while True: loop continuously reads and processes webcam frames.

Frame Handling
ret, frame = cap.read() → Captures frame from webcam.

cv2.flip(frame, 1) → Flips frame horizontally (for mirror-like view).

cv2.cvtColor(..., cv2.COLOR_BGR2RGB) → Converts BGR to RGB for MediaPipe processing.
Face Detection with MediaPipe
results = face_mesh.process(rgb) → Processes the frame to detect facial landmarks.

If a face is detected, it extracts the first face's landmarks.

Face Mesh Drawing-Draws MediaPipe’s facial mesh on the frame for visual feedback (green and blue lines).
Nose Control for Mouse Movement-Gets the nose coordinates (landmark 1).

Converts them to screen coordinates.

Moves the mouse pointer accordingly.

 Mouth-Open Detection for Left Click-Measures the distance between top and bottom lip (landmarks 13 & 14).

If the mouth is slightly open (> 0.02), it triggers a left click.




<img width="1913" height="993" alt="ss3" src="https://github.com/user-attachments/assets/aaf92afd-fd07-4ead-9a69-9aaacb5e37e0" />

Purpose: Eye Blink Detection for Screenshot
This part detects if both eyes are closed for a short time and takes a screenshot.
Eye Landmarks
Retrieves top and bottom landmarks of:

Left eye: 159, 145

Right eye: 386, 374
 Eye Distance Calculation
Calculates vertical distance for each eye using the Euclidean formula.

If both distances are less than 0.01, it means both eyes are closed.

 Screenshot Trigger Logic-Starts a timer when eyes close.

If they stay closed for ≥ 1 second, it calls show_fast_screenshot() (which saves and shows the screenshot).

Resets if eyes reopen.

Display Window
Shows the processed frame in a window titled "Gesture Mouse".

Exit Condition
ESC key (keycode 27) breaks the loop and ends the program.

Cleanup
Releases camera and destroys OpenCV windows.





# Diagrams
<img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/01f8b288-9fe9-4253-a6a1-f6f3510400f4" />


For Hardware:

webcam input only

# Build Photos
![Components](Add photo of your components here)
*List out all components shown*

![Build](Add photos of build process here)
*Explain the build steps*

![Final](Add photo of final product here)
*Explain the final build*

### Project Demo
# Video
https://drive.google.com/file/d/1M6LK2pmpBatKaMyYFcAg0bfmw5uFyy8n/view?usp=drivesdk


*Explain what the video demonstrates*

# Additional Demos
deployment link -https://github.com/Josh123-Joseph/Face-it


## Team Contributions
Joshua Joseph- Lead developer, gesture logic and blink screenshot implementation
               Integrated face mesh visualization
               UI debugging and responsiveness

Jeff Jacob Mathew- Testing and parameter tuning (mouth click sensitivity, blink delay)
                   Screenshot display and subprocess window handling
                   Documentation and demo preparation

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--25-25?link=https%3A%2F%2Fwww.tinkerhub.org%2Fevents%2FQ2Q1TQKX6Q%2FUseless%2520Projects)



