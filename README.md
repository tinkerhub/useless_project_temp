<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# The needy Plant 🎯


## Basic Details
### Team Name: 404Found


### Team Members
- Team Lead: EB Fathima Suhana - Sree Narayana Gurukulam College of Engineering
- Member 2: Nimisha Roy - Sree Narayana Gurukulam College of Engineering

### Project Description
Do you think of yourself as a gardener? 
Do you think you have what it takes to nurture a plant?
Then let's put your confidence to test through a little survival game.
Let's see which one of you will emerge unscathed - whether mentally or physically.

### The Problem (that doesn't exist)

People already have enough real responsibilities, so we decided to create another one. The player must care for a plant that exists only inside the browser. The plant remembers neglect, complains about care, changes its requirements, and occasionally punishes the player for doing exactly what it asked.

The game is intentionally unnecessary. It turns simple plant care into a strangely serious responsibility involving unpredictable watering intervals, emotional support, sunlight management, pointless actions, and absurd plant bureaucracy

### The Solution (that nobody asked for)

People already have enough real responsibilities, so we decided to create another one. The player must care for a plant that exists only inside the browser. The plant remembers neglect, complains about care, changes its requirements, and occasionally punishes the player for doing exactly what it asked.

The game is intentionally unnecessary. It turns simple plant care into a strangely serious responsibility involving unpredictable watering intervals, emotional support, sunlight management, pointless actions, and absurd plant bureaucracy

## Technical Details
### Technologies/Components Used
For Software:
- HTML5, CSS3, javascript.
- chatgpt, claude, manusAI, freebuff.

### Implementation
For Software:
git clone [github repo](https://github.com/welive22/useless_project_temp)
cd useless project temp

### Project Documentation
For Software:

## Screenshots

### Main Game Screen

![Main game screen](screenshots/main-game.png)

*The main screen shows the pixel-art plant, its current mood, health meters, and care actions.*

### Care Actions

![Care actions](screenshots/care-actions.png)

*The player can water, fertilize, compliment, or otherwise inconvenience the plant.*

### History and Achievements

![History and achievements](screenshots/history-achievements.png)

*The game records the player's unnecessary commitment through history and achievements.*


# Diagrams

## Game Workflow

```mermaid
flowchart TD
    A[Open the game] --> B[Load saved plant]
    B --> C[Calculate time away]
    C --> D[Apply offline deterioration]
    D --> E[Display plant condition]

    E --> F{Choose an action}
    F --> G[Water plant]
    F --> H[Give sunlight]
    F --> I[Fertilize]
    F --> J[Adjust temperature]
    F --> K[Compliment plant]
    F --> L[Inspect soil]
    F --> M[Do nothing]

    G --> N[Update plant state]
    H --> N
    I --> N
    J --> N
    K --> N
    L --> N
    M --> N

    N --> O[Update mood, history, and achievements]
    O --> P[Save to LocalStorage]
    P --> E
```

*The game loads the saved plant, calculates time away, applies offline deterioration, processes the player's action, and saves the updated state locally in the browser.*

### Project Demo
## Project Demo

[Watch the gameplay demo on Google Drive](https://drive.google.com/file/d/1YVwadRlpBz5FqQXL06TBVk5ZKipfl3rE/view?usp=sharing)
This video demonstrates the plant-care actions, randomized reactions, pixel-art animation, pointless actions, and saved plant progression.


## Team Contributions
- Nimisha Roy: Implemented the JavaScript logic, LocalStorage saving, offline progression, random events, and achievements.
- EB Fathima Suhana:  Designed the game concept, plant personality, useless mechanics, and gameplay rules. Created the pixel-art interface, integrated the plant animation frames, styled the responsive layout, and tested the game.

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)



