# ProcrastiBot 🤖⏳

> **The world's most unnecessary productivity tracker.**

## Basic Details

### Team Name: IDIOTIC ARENA

### Team Members

* **Team Lead:** Muhammed Bilal S- College of engineering , Karunagapally
*

---

## Project Description

**ProcrastiBot** is an AI-inspired useless productivity tracker that watches for movement and judges you when you stop doing anything for too long.

If no movement is detected for a specific period, the device activates an LED, makes a dramatic sound, and displays sarcastic messages such as:

> **"Congratulations! You successfully avoided work."**

It also includes an **"I'll Start Now" button** that does absolutely nothing. 😂

---

## The Problem (that doesn't exist)

People sometimes waste time instead of working.

Unfortunately, nobody had invented a device that physically detects your lack of movement and publicly judges your productivity.

This problem probably did not need solving.

---

## The Solution (that nobody asked for)

Introducing **ProcrastiBot**.

Using a PIR motion sensor, an ESP32 constantly checks whether you are moving.

If you remain inactive for too long:

* 🚨 The warning LED activates.
* 🔊 A dramatic buzzer sounds.
* 📺 The OLED display shows sarcastic messages.
* 📊 The device declares that you are procrastinating.
* 🔘 You can press the **"I'll Start Now"** button.

And absolutely nothing happens.

Problem solved. Nobody is happy.

---

# Technical Details

## Technologies/Components Used

### For Software:

* **C++**
* **Arduino Framework**
* **ESP32 Arduino Core**
* **Adafruit GFX Library**
* **Adafruit SSD1306 Library**
* **Arduino IDE**

### For Hardware:

* **ESP32 Development Board**
* **HC-SR501 PIR Motion Sensor**
* **0.96-inch SSD1306 OLED Display**
* **Buzzer**
* **LED**
* **220Ω Resistor**
* **Push Button**
* **Breadboard**
* **Jumper Wires**
* **USB Cable**

---

# Implementation

## Hardware Connections

| Component      | ESP32 Pin |
| -------------- | --------- |
| PIR Sensor OUT | GPIO 13   |
| LED            | GPIO 2    |
| Buzzer         | GPIO 25   |
| Button         | GPIO 26   |
| OLED SDA       | GPIO 21   |
| OLED SCL       | GPIO 22   |

---

## Installation

### 1. Install Arduino IDE

Install the Arduino IDE and configure it for ESP32 development.

### 2. Install Required Libraries

Install the following libraries through the Arduino Library Manager:

```text
Adafruit GFX
Adafruit SSD1306
```

### 3. Connect the ESP32

Connect the ESP32 board to your computer using a USB cable.

### 4. Select the Board

In Arduino IDE:

```text
Tools → Board → ESP32 Dev Module
```

Select the correct COM port.

---

# Run

1. Open the ProcrastiBot Arduino project.
2. Connect all hardware components according to the circuit connections.
3. Upload the code to the ESP32.
4. Power on the device.
5. Move around to convince ProcrastiBot that you are productive.
6. Stop moving.
7. Wait for the inactivity timer.
8. Get judged by a machine. 🤖

---

# Features

### 🕵️ Movement Detection

The PIR sensor continuously monitors movement.

### 😴 Procrastination Detection

If no movement is detected for a specific amount of time, ProcrastiBot assumes you have stopped being productive.

### 🚨 Dramatic Warning System

The system activates:

* LED warning
* Buzzer
* Sarcastic OLED message

### 😂 Useless Button

The device includes a button labelled:

> **"I'll Start Now"**

Pressing it changes absolutely nothing.

---

# Project Documentation

## Screenshots

### 1. ProcrastiBot Starting Screen

*The OLED display showing the ProcrastiBot startup screen.*

---

### 2. Normal Productivity Monitoring

*The device monitoring movement and pretending to measure productivity.*

---

### 3. Procrastination Detected

*The system detects inactivity and displays a sarcastic warning message.*

---

# Diagrams

## Workflow

```text
          START
            │
            ▼
    ┌───────────────┐
    │ Check Movement│
    │  PIR Sensor   │
    └───────┬───────┘
            │
       Movement?
       /        \
     YES        NO
      │          │
      ▼          ▼
 Reset Timer   Check Timer
      │          │
      │     Time Exceeded?
      │       /       \
      │     NO        YES
      │     │          │
      └─────┘          ▼
               🚨 PROCRASTINATION
                      │
                      ▼
                 Turn LED ON
                      │
                      ▼
                 Activate Buzzer
                      │
                      ▼
                Show Sarcastic Message
```

*ProcrastiBot monitors movement and assumes inactivity means procrastination.*

---

# Schematic & Circuit

## Circuit Connections

```text
                    ESP32
              ┌────────────────┐
              │                │
 PIR OUT ─────►│ GPIO 13        │
              │                │
 LED ─────────►│ GPIO 2         │
              │                │
 BUZZER ──────►│ GPIO 25        │
              │                │
 BUTTON ──────►│ GPIO 26        │
              │                │
 OLED SDA ────►│ GPIO 21        │
 OLED SCL ────►│ GPIO 22        │
              │                │
              └────────────────┘
```

*The ESP32 receives movement information from the PIR sensor and controls the OLED display, LED, buzzer, and useless button.*

---

# Future Plans 🚀

Because apparently this project isn't useless enough, future versions may include:

* 📊 **Procrastination Percentage**
* 🏆 **Achievement System**
* 😂 Random sarcastic motivational quotes
* 📱 Phone usage detection
* 🤖 AI camera-based procrastination detection
* 🔥 Fake productivity rankings
* 🛑 A larger button that still does nothing

---

# Built With ❤️ and Absolutely No Productivity

> **"Why procrastinate alone when a machine can judge you too?"**
