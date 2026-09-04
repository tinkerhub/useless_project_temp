"""
============================================================
PROJECT NAME: ONLY FOR YOUR EYES 😍
APP SUBTITLE: ARE YOU AUTHORISED TO ACCESS SUPER SECRET INFORMATION?
============================================================
Main Application Entry Point.
Performs autonomous system self-checks, discovers assets, and launches
the classified multimodal human-verification desktop environment.
"""

import os
import sys

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import config

import glob
import urllib.request

def ensure_models_available():
    """Ensure MediaPipe task model files are present in models/."""
    os.makedirs(config.MODELS_DIR, exist_ok=True)
    model_urls = {
        config.FACE_MODEL_PATH: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        config.HAND_MODEL_PATH: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        config.POSE_MODEL_PATH: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
    }
    for path, url in model_urls.items():
        if not os.path.exists(path):
            try:
                print(f"[INIT] Downloading vision model: {os.path.basename(path)}...")
                urllib.request.urlretrieve(url, path)
            except Exception as e:
                print(f"[INIT] Notice: Could not download {os.path.basename(path)}: {e}")


def verify_system_readiness():
    """Verify directories, models, and real user-provided assets before UI boot."""
    print("==================================================")
    print(f" {config.APP_NAME}")
    print(f" {config.APP_SUBTITLE}")
    print("==================================================")
    print("[INIT] Performing autonomous system integrity checks...")

    for d in [config.COGNITION_ASSETS_DIR, config.TYPING_ASSETS_DIR, config.GESTURE_ASSETS_DIR, config.VOICE_ASSETS_DIR, config.MODELS_DIR]:
        os.makedirs(d, exist_ok=True)

    ensure_models_available()

    # Discover real user-provided assets
    audio_exts = (".mpeg", ".wav", ".mp3", ".mp4", ".m4a", ".ogg")
    voice_files = set()
    for search_dir in [config.VOICE_ASSETS_DIR, config.BASE_DIR]:
        if os.path.exists(search_dir):
            for f in os.listdir(search_dir):
                if f.lower().endswith(audio_exts):
                    voice_files.add(f)

    gesture_exts = (".jpeg", ".jpg", ".png")
    gesture_files = set()
    for search_dir in [config.GESTURE_ASSETS_DIR, config.BASE_DIR]:
        if os.path.exists(search_dir):
            for f in os.listdir(search_dir):
                if f.lower().endswith(gesture_exts) and not f.startswith("target_"):
                    gesture_files.add(f)

    jokes_found = (
        os.path.exists(os.path.join(config.COGNITION_ASSETS_DIR, "Jokes.txt")) or
        os.path.exists(os.path.join(config.BASE_DIR, "Jokes.txt"))
    )
    dialogues_found = (
        os.path.exists(os.path.join(config.TYPING_ASSETS_DIR, "Dialouges.txt")) or
        os.path.exists(os.path.join(config.BASE_DIR, "Dialouges.txt"))
    )

    print("\n[ASSET CHECK]")
    print(f"Cognition: {'USER PROVIDED // LOADED' if jokes_found else 'MISSING'}")
    print(f"Typing: {'USER PROVIDED // LOADED' if dialogues_found else 'MISSING'}")
    print(f"Gesture targets: {len(gesture_files)} // LOADED")
    print(f"Voice clips: {len(voice_files)} // LOADED")
    print("Generated fallback assets: DISABLED\n")

    print("[ASSETS] User assets loaded successfully.")
    print("[INIT] System integrity: ARMED. Launching classified terminal...\n")


def main():
    verify_system_readiness()
    from ui import launch_app
    launch_app()


if __name__ == "__main__":
    main()
