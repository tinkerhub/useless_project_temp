<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# Pallu Techo?
"Smile it up!!"

## Basic Details
### Team Name: Techquila


### Team Members
 - Asna Fathima KM - Model Engineering College
 - Sreya Sudevan - Model Engineering College

### Project Description
*Pallu Techo?* is a fun project that detects and analyses the colour of your teeth through a webcam. It gives you a *Velluppu-O-Meter* score, roasts / compliments you with a BGM and lets you compete for the top spot in the *Pallu Premier League* - because apparently, even teeth need a leaderboard.


### The Problem (that doesn't exist)
The problem of not knowing whose teeth are whiter — mine or my friend’s.

### The Solution (that nobody asked for)
By competing in the Pallu Premier League (PPL)

## Technical Details



### Technologies/Components Used

#### For Software:

- **Languages used:** Python, JavaScript, HTML, CSS
- **Frontend Framework:** React
- **Frontend Build Tool:** Vite
- **Backend Framework:** FastAPI
- **Computer Vision:** OpenCV, MediaPipe
- **Numerical Processing:** NumPy
- **Database:** SQLite
- **Frontend Libraries:** React Router, Tailwind CSS
- **API Communication:** REST API using JSON
- **Development Tools:** VS Code, Ubuntu Linux, npm, Python virtual environment
- **Version Control:** Git and GitHub
- **Deployment:** Render

### Implementation

#### For Software:
Pallu-Techo? is implemented as a client-server web application consisting of a React frontend and a FastAPI backend.

The application follows a complete end-to-end pipeline in which the user first captures an image of their teeth using the webcam through the React frontend. The captured frame is encoded and sent to the FastAPI REST API for processing. The backend then performs image processing, mouth and tooth detection, tooth segmentation, and colour extraction. The extracted tooth colour is analysed using the **CIE LAB colour space**, after which a custom **Whiteness Score** is calculated and an approximate tooth shade is determined. The resulting analysis is stored in the **SQLite database**, and the processed result is returned to the frontend as a JSON response, where it is displayed to the user along with the **leaderboard**.


# Screenshots 

<img width="1600" height="812" alt="Pall Thecho home page" src="https://github.com/user-attachments/assets/9f93d253-6674-42e8-9645-13c72bf87c58" />
Home Screen: The main interface of Pallu Techo, where users position their teeth in the given space, enter their name, and capture their smile for analysis. 

<img width="1600" height="812" alt="Pall Thecho error page" src="https://github.com/user-attachments/assets/3c1f658a-4269-4eb5-b13d-fe5f51449de2" />
Error State: When the system detects an invalid or insufficient scan, it throws a dramatic warning.

<img width="1600" height="812" alt="Veluppometer and PPL" src="https://github.com/user-attachments/assets/89b4cebc-71f4-48af-b306-f17c8e39bb23" />
Results Screen: The Velluppu-O-Meter reveals the user’s tooth-whiteness score, while the Pallu Premier League ranks them against the other contenders.

# Architecture Diagram
             FUN
              │
       🐱 Cat mouth
              │
       🎵 Result music
              │
              ▼
       ┌──────────────┐
       │  ToothCheck  │
       └──────────────┘
              │
              ▼
       Computer Vision
              │
              ▼
          LAB Colour
              │
              ▼
       Custom Scoring
              │
              ▼
          Database
              │
              ▼
         REST API
              │
              ▼
       Cloud Deployment

### Project Demo
# Video


https://github.com/user-attachments/assets/ba1c5579-0371-476e-b415-39048852762d



https://github.com/user-attachments/assets/c301e820-638c-462c-8305-6d10bfc7ea76



## Team Contributions
- Asna Fathima KM: Frontend and deployment
- Sreya Sudevan: Backend

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
