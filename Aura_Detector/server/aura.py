import hashlib
import random
from typing import Dict, Any

from .protocol import Profile

BANDS = [
    {"band": "Quiet", "min": "0", "max": "100", "weight": 0.40},
    {"band": "Noticeable", "min": "500", "max": "1000", "weight": 0.30},
    {"band": "Powerful", "min": "5000", "max": "100000", "weight": 0.20},
    {"band": "Absurd", "min": "100000", "max": "1000000", "weight": 0.09},
    {"band": "Impossible", "min": "1000000", "max": "∞", "weight": 0.01},
]

PALETTES = ["cyan", "magenta", "gold", "green", "purple", "orange"]

class AuraEngine:
    """
    Engine to generate deterministic aura profiles.
    """
    def __init__(self):
        self.session_seed = str(random.random())
        
    def generate_profile(self, track_id: int) -> Profile:
        """
        Generate a deterministic profile for a subject.
        """
        h = hashlib.sha256(f"{self.session_seed}_{track_id}".encode()).hexdigest()
        
        # Select band based on probability
        r = int(h[:8], 16) / 0xffffffff
        cumulative = 0.0
        selected_band = BANDS[0]
        for band in BANDS:
            cumulative += band["weight"]
            if r <= cumulative:
                selected_band = band
                break
                
        # Select palette based on hash
        palette_idx = int(h[8:16], 16) % len(PALETTES)
        palette = PALETTES[palette_idx]
        
        return Profile(
            band=selected_band["band"],
            min=selected_band["min"],
            max=selected_band["max"],
            palette=palette
        )
