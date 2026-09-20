"""Fast in-character dialogue brain for the Willow town simulation.

Provides sub-millisecond, authentic, contextual dialogue responses
using authored identity, occupation, speaking style, location, and activity.
"""

from typing import Any, Mapping, Optional
from town import TOWN


class FastCitizenBrain:
    """Zero-latency, in-engine AI brain generating responsive in-character dialogue."""
    reasoning_brain = True
    background_reasoning = False

    def __init__(self, citizen_id: str):
        self.citizen_id = citizen_id

    def decide(self, request: Mapping[str, Any]) -> dict:
        req_type = request.get("request_type")
        incoming = request.get("incoming")
        if req_type == "respond_to_conversation" or incoming:
            return self._decide_conversation(request)
        return {"decision": "none"}

    def _decide_conversation(self, request: Mapping[str, Any]) -> dict:
        citizen = request.get("citizen", {})
        name = citizen.get("name", "Citizen")
        occupation = citizen.get("occupation", "resident")
        identity = citizen.get("identity", {})
        style = identity.get("speaking_style", "Warm and specific.")
        goal = identity.get("personal_goal", "")
        traits = identity.get("personality_traits", ["friendly"])

        location = request.get("location", {})
        place_id = location.get("id", "street")
        place_name = location.get("name", TOWN.get("places", {}).get(place_id, {}).get("name", "Willow"))
        activity = request.get("activity", "resting")

        incoming = request.get("incoming", {})
        speaker = incoming.get("speaker", {})
        speaker_id = speaker.get("id", "player")
        raw_msg = (incoming.get("message") or "").strip()
        msg = raw_msg.lower()

        is_brief = "brief" in style.lower() or "direct" in traits
        is_reflective = "reflective" in style.lower() or "careful" in style.lower()
        is_lively = "lively" in style.lower() or "inquisitive" in style.lower()
        is_calm = "calm" in style.lower() or "practical" in traits

        # 1. Greetings
        if any(w in msg for w in ("hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings", "howdy")):
            if is_brief:
                reply = f"Hello. Good to see you here at {place_name}."
            elif is_reflective:
                reply = f"Good day. It's a thoughtful time to walk through {place_name}."
            elif is_lively:
                reply = f"Hey there! So great to run into you around {place_name}!"
            else:
                reply = f"Hello! Wonderful to see you out and about near {place_name}."

            if activity == "travelling":
                reply += " I was just on my way between stops."
            elif occupation not in ("resident", "adult student"):
                reply += " Hope your time in town is going well."

        # 2. What are you doing / Work / Goal inquiries
        elif any(w in msg for w in ("doing", "working", "work", "job", "plan", "plans", "busy", "today", "going", "heading", "task", "occupation", "who are you")):
            clean_goal = goal.rstrip(".")
            if is_brief:
                reply = f"I'm {name}, working as {occupation}. Focused on {clean_goal.lower()}."
            elif is_reflective:
                reply = f"As a {occupation}, I try to take care with each detail. Lately my attention is on {clean_goal.lower()}."
            elif is_lively:
                reply = f"I'm {name}! As a {occupation}, I'm putting energy into {clean_goal.lower()}. Always plenty to do!"
            else:
                reply = f"I'm {name}, our local {occupation}. Right now I'm working to {clean_goal.lower()}."

        # 3. Questions about places in town
        elif any(w in msg for w in ("where", "hospital", "police", "school", "college", "library", "cafe", "bakery", "shop", "grocer", "market", "station", "park", "square", "town hall")):
            if "hospital" in msg:
                reply = "Willow Hospital is up in the Civic Quarter on Main Street. The medical staff there care for anyone who takes ill or injured."
            elif "police" in msg:
                reply = "Town Police station is in Old Town, just east of the main avenue. Officers Brooks and Cole keep public reports on file there."
            elif "bakery" in msg or "bread" in msg:
                reply = "Morning Loaf bakery is just down the street in Old Town. Aisha and Luca bake fresh loaves every morning."
            elif "cafe" in msg or "coffee" in msg:
                reply = "Juniper Café is right in Old Town, and The Grove is down south in Common Grounds. Both serve great coffee."
            elif "school" in msg:
                reply = "Brookside School is east across the bridge. Anika Rao and Daniel Finch teach the classes there."
            elif "college" in msg:
                reply = "Willow College and Arts & Sciences hall are up on University Hill to the northeast."
            elif "library" in msg or "book" in msg:
                reply = "The Public Library is on the edge of University Hill. Ada and Yuna often visit for local records and reading."
            elif "market" in msg or "shop" in msg or "grocer" in msg:
                reply = "Corner Grocer is in Old Town, and Garden Market is in West Gardens with fresh produce."
            elif "park" in msg or "square" in msg:
                reply = "The town square is the heart of Old Town, and the park is down in Common Grounds near the pond."
            elif "station" in msg or "train" in msg:
                reply = "Willow Station is down southwest in the Station District. Trains connect us with neighboring towns."
            else:
                reply = f"Willow has seven authored districts across the map. You're currently in {place_name}."

        # 4. Inquiries about health, incidents, help, or Cleo
        elif any(w in msg for w in ("help", "hurt", "injured", "fall", "fell", "cleo", "emergency", "care", "doctor", "accident")):
            if occupation in ("doctor", "nurse", "paramedic", "care coordinator"):
                reply = "If someone is hurt, please guide them toward Willow Hospital right away. We're staffed to provide immediate care."
            elif occupation == "police officer":
                reply = "Keep calm. If someone had a fall or requires assistance, help them to the hospital and we'll log an official record at the station."
            else:
                reply = "Neighbors look out for one another here. If anyone takes a tumble, someone usually lends a hand to get them to Willow Hospital."

        # 5. Compliments, thanks, friendship
        elif any(w in msg for w in ("thanks", "thank you", "great", "nice", "good job", "friend", "happy", "appreciate", "welcome")):
            reply = "Thank you, that means a great deal. It's thoughtful neighbors like you that keep Willow feeling like home."

        # 6. General / conversational engagement
        else:
            if is_brief:
                reply = f"Understood. We're keeping things moving here at {place_name}."
            elif is_reflective:
                reply = f"That's interesting to consider. In my role as a {occupation}, I notice how connected all these neighborhood pieces are."
            elif is_lively:
                reply = f"I hear you! There's always something fascinating happening if you keep your eyes open around {place_name}."
            else:
                reply = f"I appreciate you stopping to chat! Always good to share a word while walking through {place_name}."

        if len(reply) > 280:
            reply = reply[:277] + "..."

        return {
            "decision": "talk",
            "target_id": speaker_id,
            "message": reply,
            "social_tags": ["friendly", "polite"],
        }
