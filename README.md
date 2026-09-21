<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# Thottappan 3.0 🎯


## Basic Details
### Team Name: Sathukudi


### Team Members
- Team Lead: Johny Joji - TocH Institute of Science and Technology
- Member 2: Joel Saji - TocH Institute of Science and Technology

### Project Description
DeskMate is an ESP32-based desktop companion robot designed to be intentionally useless, entertaining, and expressive. It reacts to the user with animated OLED emotions, head movements, sounds, and funny modes like Judgement Mode, Stare Contest, and Existential Crisis Mode.


### The Problem (that doesn't exist)
In a world full of smart devices solving real problems, DeskMate solves absolutely none. It exists to judge you, interrupt your work, overthink life, and make your desk slightly more chaotic.


### The Solution (that nobody asked for)
Meet DeskMate — your completely unnecessary desk companion. An ESP32-powered robot that watches you, judges you, changes moods, moves its head, makes noises, and occasionally reminds you that you’re wasting your time.

## Technical Details
### Technologies/Components Used
For Software:
- Language: C/C++
- Framework: Arduino Framework
- U8g2lib, ESP32Servo, Wire
- Arduino IDE, ESP32 development board, Serial Monitor

For Hardware:
- ESP32
- 1.3" SH1106 OLED displays
- PIR motion sensor
- SG90 servo motor
- Buzzer
- Push buttons
- LEDs
- Optional LDR

### Implementation
For Software:
Developed using C/C++ with the Arduino Framework.
Used U8g2lib and Wire to control the SH1106 OLED displays.
Used ESP32Servo to control the SG90 servo motor.
Implemented a state machine to manage emotions and user-presence states.
Used GPIO-based input/output to communicate with the PIR sensor, buttons, buzzer, and other components.
Tested each hardware component independently before integrating them into the complete DeskMate system.
# Installation
 1. Install Arduino IDE
 2. Add ESP32 board support
 3. Install the required libraries from Library Manager:
    - U8g2
    - ESP32Servo

 4. Connect the ESP32 via USB
 5. Select:
    Board → ESP32 Dev Module
    Port → Your ESP32 port

 6. Upload the DeskMate firmware

# Run
Connect the ESP32 via USB
 Select the ESP32 board and correct port
 Click Upload
 Open the project in Arduino IDE

 After uploading, open:
Tools → Serial Monitor
 Set the baud rate to match the firmware (e.g. 115200)

### Project Documentation
For Software:
DeskMate’s software is built using C/C++ with the Arduino framework. The ESP32 controls all connected components and uses a state-machine architecture to manage user presence and robot emotions.

OLED Display: U8g2lib for animated facial expressions and text.
Presence Detection: PIR sensor input triggers different emotional states.
Servo Control: ESP32Servo controls DeskMate’s head movement.
State Management: Handles states such as Happy, Suspicious, Sad, and Sleepy.
Hardware Interaction: GPIO pins are used to communicate with sensors, buttons, buzzer, and LEDs.
The system is designed in a modular, component-by-component manner, making it easier to test and expand with additional useless modes.


# Diagrams
45107af5-1fb4-480b-8022-c2b9ab8750d4.jpg 


# Schematic & Circuit
dac5519e-1a5a-485f-8d52-bc4055183412.png

# Build Photos
WhatsApp Image 2026-09-12 at 11.24.59 AM.jpeg
WhatsApp Image 2026-09-12 at 11.25.43 AM.jpeg

### Project Demo
# Video
https://drive.google.com/file/d/1hkq06pWdPTc5DAUIuy09ZTiJCWb54uC7/view?usp=drivesdk
here the robot is detecting a person arriving at the desk


## Team Contributions
- Joel Saji: Hardware part of the project
- Johny Joji: Software part of the project```````````````````
---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)



