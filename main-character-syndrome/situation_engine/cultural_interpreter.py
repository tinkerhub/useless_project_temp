class CulturalInterpreter:
    UNIVERSES = {
        "Indian Cinema": {"mood": "heroic", "vibe": "cinematic"},
        "Indian Comedy": {"mood": "playful", "vibe": "comic"},
        "College / Campus": {"mood": "chaotic", "vibe": "campus"},
        "Default Cinematic": {"mood": "dramatic", "vibe": "cinematic"},
        "Anime Protagonist": {"mood": "epic", "vibe": "anime"},
        "Horror Thriller": {"mood": "tense", "vibe": "horror"},
        "Meme Mode": {"mood": "absurd", "vibe": "meme"},
    }

    @classmethod
    def get_universe_options(cls):
        return list(cls.UNIVERSES.keys())

    @classmethod
    def get_universe(cls, universe_name: str | None):
        return cls.UNIVERSES.get(universe_name or "Default Cinematic", cls.UNIVERSES["Default Cinematic"])
