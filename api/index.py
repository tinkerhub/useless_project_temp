import sys
from pathlib import Path

# Add the backend folder to Python's import path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Import the FastAPI app
from main import app
