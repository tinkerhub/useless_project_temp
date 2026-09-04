from __future__ import annotations


class MusicDirector:
    SCENE_MAP = {
        "mass hero entry": "mass_entry",
        "mass_hero_entry": "mass_entry",
        "Mass Hero Entry": "mass_entry",
        "main character entrance": "hero_entry",
        "Main Character Entrance": "hero_entry",
        "bro has somewhere to be": "action",
        "Bro Has Somewhere To Be": "action",
        "unnecessary comedy chase": "cartoon_chase",
        "Unnecessary Comedy Chase": "cartoon_chase",
        "the throne has been claimed": "royal",
        "The Throne Has Been Claimed": "royal",
        "legendary recovery": "victory",
        "Legendary Recovery": "victory",
        "physically present. mentally on another planet.": "dreamy",
        "Physically Present. Mentally On Another Planet.": "dreamy",
        "brain loading...": "comedy_thinking",
        "Brain Loading...": "comedy_thinking",
        "absolutely no idea what's going on": "comedy_confusion",
        "Absolutely No Idea What's Going On": "comedy_confusion",
        "the realization has hit": "dramatic_reveal",
        "The Realization Has Hit": "dramatic_reveal",
        "everything is under control": "chaos",
        "Everything Is Under Control": "chaos",
        "the protagonist has entered the scene": "mass_entry",
    }

    def decide_category(self, situation: dict | None = None, context: dict | None = None):
        situation = situation or {}
        category = self.SCENE_MAP.get(situation.get("name"), "mass_entry")
        name = situation.get("name", "Mass Hero Entry")
        priority = "high" if any(token in name.lower() for token in ["chase", "freeze", "chaos", "sudden", "rapid"]) else "medium"
        intensity = int(situation.get("intensity", 80) or 80)
        return {
            "category": category,
            "priority": priority,
            "intensity": intensity,
        }
