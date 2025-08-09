<img width="3188" height="1202" alt="frame (3)" src="https://github.com/user-attachments/assets/517ad8e9-ad22-457d-9538-a9e62d137cd7" />


# Snap Shield 🎯


## Basic Details
### Team Name: Pixel pada


### Team Members
- Team Lead: Alphin - MACE
- Member 2: Anuranj -MACE

### Project Description
Snap shield is a comedic yet functional eye-closure detection system that uses AI to watch your eyelids. If you blink too often or keep your eyes shut for too long, it blasts a song and turns off an LED through an ESP32 — perfect for turning naps into dramatic events.

### The Problem (that doesn't exist)
Sometimes, when you accidentally fall asleep, nothing fun happens. You just… sleep. That’s boring.

### The Solution (that nobody asked for)
We use AI-powered eyelid tracking to detect suspicious sleep attempts and instantly launch a wake-up concert, complete with LED theatrics. Your naps will never be peaceful again.

## Technical Details
### Technologies/Components Used
For Software:
Languages: Python, Arduino C++
Frameworks: MediaPipe, OpenCV
Libraries: mediapipe, opencv-python, pygame, pyserial, scipy
Tools: Arduino IDE, Python 3.x

For Hardware:
Controller: ESP32 WROOM Board
Output Device: LED (with resistor)
Power Supply: USB (5V)
Other Tools: Breadboard, jumper wires

### Implementation
For Software:
# Installation
pip install opencv-python mediapipe pygame pyserial scipy

# Run
python blink_beats.py


### Project Documentation
For Software:

# Screenshots (Add at least 3)
[Real-time eyelid tracking using MediaPipe.](https://github.com/a-nuranj/anuranj/blob/main/Sleepy%20Detector%2009-08-2025%2005_02_31.png)

[Detection triggered after 3 rapid closures.](https://github.com/a-nuranj/anuranj/blob/main/Screenshot%202025-08-09%20050531.png)

[Song plays and LED turns off when sleep detected.](https://github.com/a-nuranj/anuranj/blob/main/Screenshot%202025-08-09%20050611.png)

# Diagrams
Snap shield workflow: Eye detection → Blink count logic → Song trigger → ESP32 LED control.

For Hardware:

# Schematic & Circuit
https://github.com/a-nuranj/anuranj/blob/main/WhatsApp%20Image%202025-08-09%20at%2005.10.22_b8beafa9.jpg
Connections between ESP32, LED, resistor, and GND.

# Build Photos
[LED](https://github.com/a-nuranj/anuranj/blob/main/WhatsApp%20Image%202025-08-09%20at%2005.19.09_6af1bd64.jpg)
[Resistor](https://github.com/a-nuranj/anuranj/blob/main/WhatsApp%20Image%202025-08-09%20at%2005.19.10_dc262e0a.jpg)
[esp32 WROOM](http://github.com/a-nuranj/anuranj/blob/main/WhatsApp%20Image%202025-08-09%20at%2005.19.10_af895e05.jpg)

!Final](https://github.com/a-nuranj/anuranj/blob/main/WhatsApp%20Image%202025-08-09%20at%2005.10.22_b8beafa9.jpg)

### Project Demo
# Video
(https://www.youtube.com/watch?v=FN2iBmGGBCI)
when eye blink for 3 times music starts to play and led turns off . If eye opens led turns ON and music stops playing.
# Additional Demos
[https://www.youtube.com/watch?v=g2KgJIACXjU]
when eye closed for more than 10sec , music starts to play and led gets turned off 

## Team Contributions
Anuranj-hardware,documentation
Alphin-coding,documentation

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--25-25?link=https%3A%2F%2Fwww.tinkerhub.org%2Fevents%2FQ2Q1TQKX6Q%2FUseless%2520Projects)



