"""
conftest.py — pytest fixtures shared across test modules.

Sets PYTHONPATH so 'from app.xxx import ...' resolves correctly
when pytest is run from the backend/ directory.
"""

import sys
from pathlib import Path

# Make sure 'backend/' is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))
