# Main Character Syndrome

Main Character Syndrome is a humorous AI-powered webcam experience that reads your movement, detects dramatic situations in real time, and turns ordinary moments into cinematic chaos. This version integrates official Spotify OAuth and the Spotify Web Playback SDK as the primary music engine, with procedural Web Audio as a reliable fallback.

## Installation

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Step 1: Create a Spotify Developer App

Go to https://developer.spotify.com/dashboard and create an app.

## Step 2: Configure the Redirect URI

Use:

```text
http://127.0.0.1:5000/callback
```

## Step 3: Create `.env`

Create a `.env` file in the project root:

```env
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/callback
FLASK_SECRET_KEY=
```

## Step 4: Run the app

```bash
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## Step 5: Connect Spotify

Click the "CONNECT SPOTIFY" button, log in to Spotify, and authorize the app.

## Features

- Webcam feed with MediaPipe pose overlay
- AI-driven activity and situation detection
- Spotify OAuth + Web Playback SDK
- Secure token storage in Flask session
- AI music category search and dynamic Spotify track selection
- Procedural fallback audio for offline or failed playback
- Demo buttons routed through the same detection and soundtrack pipeline

## Audio configuration

The app is designed to avoid local MP3 dependencies. Spotify is the primary music engine, while the procedural Web Audio fallback keeps the project demo-safe if the internet or Spotify setup fails.

## Docker

```bash
docker-compose up --build
```
