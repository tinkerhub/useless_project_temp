from __future__ import annotations

from .cultural_interpreter import CulturalInterpreter


class SituationClassifier:
    def classify(self, activity: dict | None = None, context: dict | None = None, event: dict | None = None, interaction: dict | None = None, universe: str | None = None, scenario_name: str | None = None):
        activity = activity or {"name": "walking", "confidence": 0.8}
        context = context or {"movement_speed": 0.7, "movement_intensity": 0.8, "head_stability": 0.8, "time_context": "evening"}
        event = event or {"name": "rapid_movement", "confidence": 0.8, "duration": 2.0}
        interaction = interaction or {"people_count": 1, "interaction": None, "experimental": True}
        universe_name = universe or "Indian Cinema"
        universe_context = CulturalInterpreter.get_universe(universe_name)

        scenario = scenario_name or self._detect_from_signals(activity, context, event)
        if scenario is None:
            scenario = "Mass Hero Entry"

        mapping = {
            "mass_entry": {
                "name": "Mass Hero Entry",
                "category": "mass_entry",
                "mood": "heroic",
                "intensity": 94,
                "narration": "Fast confident movement detected. Cinematic significance: unnecessarily high.",
            },
            "mass_hero_entry": {
                "name": "Mass Hero Entry",
                "category": "mass_entry",
                "mood": "heroic",
                "intensity": 94,
                "narration": "The hero has entered with full cinematic intent. Nobody asked for this level of presence.",
            },
            "comedy_chase": {
                "name": "Unnecessary Comedy Chase",
                "category": "cartoon_chase",
                "mood": "playful",
                "intensity": 88,
                "narration": "A chase started. The dramatic ratio is deeply suspicious.",
            },
            "royal": {
                "name": "The Throne Has Been Claimed",
                "category": "royal",
                "mood": "royal",
                "intensity": 92,
                "narration": "The seat is occupied. The aura is formally dramatic.",
            },
            "victory": {
                "name": "Legendary Recovery",
                "category": "victory",
                "mood": "triumphant",
                "intensity": 82,
                "narration": "A refreshing water break, turned into an iconic come-back moment.",
            },
            "dreamy": {
                "name": "Physically Present. Mentally On Another Planet.",
                "category": "dreamy",
                "mood": "dreamy",
                "intensity": 60,
                "narration": "The body is here, but the thoughts are in a different dimension.",
            },
            "comedy_thinking": {
                "name": "Brain Loading...",
                "category": "comedy_thinking",
                "mood": "confused",
                "intensity": 58,
                "narration": "This is not a freeze. This is a processor issue.",
            },
            "comedy_confusion": {
                "name": "Absolutely No Idea What's Going On",
                "category": "comedy_confusion",
                "mood": "confused",
                "intensity": 70,
                "narration": "The eyes are searching, the brain is still asking for instructions.",
            },
            "dramatic_reveal": {
                "name": "The Realization Has Hit",
                "category": "dramatic_reveal",
                "mood": "tense",
                "intensity": 90,
                "narration": "This is the moment where the plot twists without warning.",
            },
            "chaos": {
                "name": "Everything Is Under Control",
                "category": "chaos",
                "mood": "chaotic",
                "intensity": 96,
                "narration": "It is absolutely not under control.",
            },
            "hero_entry": {
                "name": "Main Character Entrance",
                "category": "hero_entry",
                "mood": "heroic",
                "intensity": 90,
                "narration": "The hair flip wasn't planned. The visual impact was.",
            },
            "action": {
                "name": "Bro Has Somewhere To Be",
                "category": "action",
                "mood": "urgent",
                "intensity": 86,
                "narration": "Someone has important business. The business is probably not important.",
            },
        }

        if scenario_name and scenario_name.lower() in {"mass_entry", "main_character_entrance", "mass hero entry", "mass-hero-entry"}:
            selected = mapping["mass_entry"]
        elif scenario_name and "chase" in scenario_name.lower():
            selected = mapping["comedy_chase"]
        elif scenario_name and "freeze" in scenario_name.lower():
            selected = mapping["dramatic_reveal"]
        elif scenario_name and "chaos" in scenario_name.lower():
            selected = mapping["chaos"]
        elif scenario_name and "royal" in scenario_name.lower():
            selected = mapping["royal"]
        elif scenario_name and "water" in scenario_name.lower():
            selected = mapping["victory"]
        elif scenario_name and "zone" in scenario_name.lower():
            selected = mapping["dreamy"]
        elif scenario_name and "hair" in scenario_name.lower():
            selected = mapping["hero_entry"]
        elif scenario_name and "action" in scenario_name.lower():
            selected = mapping["action"]
        else:
            selected = self._from_activity(activity, context, event, mapping)

        selected.update({
            "universe": universe_name,
            "reason": selected.get("narration", "Movement created a cinematic interpretation."),
            "mood": selected.get("mood", universe_context["mood"]),
        })
        return selected

    @staticmethod
    def _detect_from_signals(activity: dict, context: dict, event: dict):
        name = activity.get("name", "walking")
        speed = context.get("movement_speed", 0.7)
        if name in {"walking", "running"} and speed > 0.7:
            return "Mass Hero Entry"
        if event.get("name") == "chaos":
            return "Everything Is Under Control"
        if event.get("name") == "possible_zone_out":
            return "Physically Present. Mentally On Another Planet."
        if name == "standing_still" and context.get("movement_speed", 0) < 0.2:
            return "The Throne Has Been Claimed"
        return "Mass Hero Entry"

    @staticmethod
    def _from_activity(activity: dict, context: dict, event: dict, mapping: dict):
        name = activity.get("name", "walking")
        speed = context.get("movement_speed", 0.7)
        if event.get("name") == "chaos":
            return mapping["chaos"]
        if event.get("name") == "possible_zone_out":
            return mapping["dreamy"]
        if name in {"walking", "running"} and speed > 0.7:
            return mapping["mass_entry"]
        if name == "standing_still" and context.get("posture") == "sitting":
            return mapping["royal"]
        if name == "drinking_water":
            return mapping["victory"]
        if name == "looking_around":
            return mapping["comedy_confusion"]
        return mapping["mass_entry"]
