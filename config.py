# ============================================================
# ONLY FOR YOUR EYES 😍
# System Configuration & Security Constants
# ============================================================

import os

# -------------------- BRANDING --------------------
APP_NAME = "ONLY FOR YOUR EYES 😍"
APP_SUBTITLE = "ARE YOU AUTHORISED TO ACCESS SUPER SECRET INFORMATION?"
APP_VERSION = "2.4.0-CLASSIFIED"
CLEARANCE_BADGE = "SECURITY CLEARANCE LEVEL: TOP SECRET // NOFORN // ORCON"

# -------------------- PROTOCOL WEIGHTS --------------------
# Suggested starting weights:
# Human Cognition: 10%
# Behavioural Typing: 20%
# Expression + Gesture: 30%
# Voice Response: 20%
# Final Behavioural Assessment: 20%
WEIGHT_COGNITION = 0.10
WEIGHT_TYPING = 0.20
WEIGHT_MULTIMODAL = 0.30
WEIGHT_VOICE = 0.20
WEIGHT_ASSESSMENT = 0.20

# -------------------- INDEPENDENT GATE THRESHOLDS --------------------
# Tuned for realistic human demonstration while still flagging bots & macros.
THRESHOLD_COGNITION = 40.0      # Min % semantic similarity / concept match
THRESHOLD_TYPING = 40.0         # Min % human behavioural consistency
THRESHOLD_MULTIMODAL = 40.0     # Min % multimodal compatibility
THRESHOLD_VOICE = 40.0          # Min % voice response score
THRESHOLD_FINAL_CLEARANCE = 60.0

# -------------------- THREAT LEVEL BANDS --------------------
THREAT_LEVELS = {
    "LOW": (88, 100),
    "MODERATE": (70, 87),
    "SUSPICIOUS": (40, 69),
    "CRITICAL": (0, 39)
}

# -------------------- CLASSIFIED PAYLOAD --------------------
# MUST MATCH EXACTLY AS SPECIFIED:
CLASSIFIED_MESSAGE = """The SUPeR SECret COde is:

print("Hello world!")"""

# Classified Final Action link
FINAL_TRANSMISSION_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
FINAL_TRANSMISSION_LABEL = "[ ACCESS FINAL TRANSMISSION ]"

# -------------------- FILE & DIRECTORY PATHS --------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ASSETS_DIR = os.path.join(BASE_DIR, "assets")
COGNITION_ASSETS_DIR = os.path.join(ASSETS_DIR, "cognition")
TYPING_ASSETS_DIR = os.path.join(ASSETS_DIR, "typing")
GESTURE_ASSETS_DIR = os.path.join(ASSETS_DIR, "gestures")
VOICE_ASSETS_DIR = os.path.join(ASSETS_DIR, "voice")

MODELS_DIR = os.path.join(BASE_DIR, "models")
FACE_MODEL_PATH = os.path.join(MODELS_DIR, "face_landmarker.task")
HAND_MODEL_PATH = os.path.join(MODELS_DIR, "hand_landmarker.task")
POSE_MODEL_PATH = os.path.join(MODELS_DIR, "pose_landmarker_lite.task")

# -------------------- UI THEME & PALETTE --------------------
# Dark classified cybersecurity terminal aesthetic
BG_COLOR = "#070A0E"           # Deep onyx terminal background
BG_SURFACE = "#0C1017"         # Elevated surface
PANEL_COLOR = "#111722"        # Panel background
PANEL_BORDER = "#1E2735"       # Subdued panel border
BORDER_FOCUS = "#00FF9C"       # Cyber active border

# Primary accent & status colors
COLOR_ACCENT = "#00FF9C"       # Neon Terminal Emerald (Passed / Verified)
COLOR_CYAN = "#00E5FF"         # Tactical Cyan (Information / Sensors)
COLOR_TEXT = "#E6EDF3"         # Bright Terminal Text
COLOR_MUTED = "#6E7681"        # Muted Subtext / Labels
COLOR_WARNING = "#FFC857"      # Alert Amber (Active analysis / Scanning)
COLOR_DANGER = "#FF334B"       # Critical Red (Bot detected / Access denied)
COLOR_BAR_BG = "#161B22"       # Metric meter background

# Typography
FONT_MONO = "Consolas"
FONT_TITLE_SIZE = 22
FONT_SUBTITLE_SIZE = 11
FONT_HEADING_SIZE = 15
FONT_BODY_SIZE = 12
FONT_CODE_SIZE = 13
FONT_SMALL_SIZE = 10

# Window Dimensions
WINDOW_WIDTH = 1080
WINDOW_HEIGHT = 760
