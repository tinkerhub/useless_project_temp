"""Server-owned world state and its shared validated action boundary."""

import copy
import json
import math
import os
from pathlib import Path
import queue
import tempfile
import threading

from spatial import SpatialWorldMixin, initialize_spatial, validate_spatial
from town import TOWN, distance, destination_anchor, clear_segment


MAX_MESSAGE_LENGTH = 500
MAX_SOCIAL_VALUE = 5
TALK_INTENTS = {"neutral", "confide", "encourage", "insult", "report_help", "report_harm"}
REPORT_INTENTS = {"report_help", "report_harm"}
SCHEMA_VERSION = 5
HOURS_PER_DAY = 24
LOW_ENERGY = 25
RESTED_ENERGY = 60
HIGH_HUNGER = 80
ACTIVITIES = {"sleeping", "travelling", "resting", "at_regular_destination", "needs_help", "receiving_care"}
MAX_IDENTITY_TEXT_LENGTH = 160
MAX_TRAIT_LENGTH = 40
MAX_PERSONALITY_TRAITS = 3
MAX_IDENTITY_LIST_LENGTH = 5
MAX_SHORT_TERM_GOALS = 3
MAX_GOAL_TEXT_LENGTH = 120
MAX_AI_CONTEXT_MEMORIES = 20
AI_REPLY_COOLDOWN_TICKS = 1
AI_TIMEOUT_SECONDS = 1.0
EMOTIONAL_STATES = frozenset({
    "content", "anxious", "happy", "sad", "angry",
    "fearful", "curious", "tired", "grateful", "frustrated",
})
SOCIAL_TAGS = frozenset({
    "friendly", "suspicious", "grateful", "angry",
    "fearful", "interested", "dismissive",
})
SOCIAL_TAG_EFFECTS = {
    "friendly": ("friendship", 1),
    "suspicious": ("trust", -1),
    "grateful": ("trust", 1),
    "angry": ("anger", 1),
    "fearful": None,
    "interested": ("friendship", 1),
    "dismissive": ("friendship", -1),
}
MAX_SOCIAL_TAGS_PER_RESPONSE = 3


STARTER_IDENTITIES = {
    "citizen-1": {
        "personality_traits": ["curious", "considerate"],
        "personal_goal": "Understand the people in the neighborhood.",
        "speaking_style": "Warm, concise, and observant.",
    },
    "citizen-2": {
        "personality_traits": ["practical", "reserved"],
        "personal_goal": "Keep home life stable and dependable.",
        "speaking_style": "Direct, calm, and economical.",
    },
    "citizen-3": {
        "personality_traits": ["energetic", "helpful"],
        "personal_goal": "Become someone the neighborhood can rely on.",
        "speaking_style": "Friendly, upbeat, and candid.",
    },
}

STARTER_PROFILES = {
    "citizen-1": {
        "values": ["honesty", "community"],
        "fears": ["being forgotten"],
        "habits": ["morning walks", "greeting strangers"],
        "long_term_goals": ["Understand the people in the neighborhood."],
    },
    "citizen-2": {
        "values": ["stability", "self-reliance"],
        "fears": ["disruption"],
        "habits": ["keeping the house tidy"],
        "long_term_goals": ["Keep home life stable and dependable."],
    },
    "citizen-3": {
        "values": ["kindness", "reliability"],
        "fears": ["letting people down"],
        "habits": ["checking on neighbors"],
        "long_term_goals": ["Become someone the neighborhood can rely on."],
    },
}


def default_identity(citizen_id):
    return copy.deepcopy(STARTER_IDENTITIES.get(citizen_id, {
        "personality_traits": ["thoughtful"],
        "personal_goal": "Build a steady life in the neighborhood.",
        "speaking_style": "Plainspoken and concise.",
    }))


def default_profile(citizen_id, personal_goal="Build a steady life in the neighborhood."):
    return copy.deepcopy(STARTER_PROFILES.get(citizen_id, {
        "values": ["stability"],
        "fears": ["uncertainty"],
        "habits": ["daily routine"],
        "long_term_goals": [personal_goal],
    }))


def starter_world():
    state = {
        "schema_version": SCHEMA_VERSION,
        "clock": {"tick": 0, "running": False},
        "locations": {
            "street": {"kind": "street", "name": "Main Street"},
            "home-1": {"kind": "home", "name": "Home One"},
            "home-2": {"kind": "home", "name": "Home Two"},
            "shop": {"kind": "shop", "name": "Corner Shop"},
        },
        "paths": {
            f"path-{place}": {"from": "street", "to": place, "bidirectional": True}
            for place in ("home-1", "home-2", "shop")
        },
        "citizens": {
            f"citizen-{i}": {
                "name": name, "location_id": home, "home_id": home,
                "food": 0, "money": 100,
                "identity": default_identity(f"citizen-{i}"),
                **default_profile(f"citizen-{i}"),
                "needs": {"hunger": 0, "energy": 100},
                "schedule": {
                    "regular_destination_id": "shop",
                    "leave_home_hour": 8,
                    "return_home_hour": 18,
                    "sleep_hour": 22,
                    "wake_hour": 6,
                },
                "activity": "resting",
                "current_plan": None,
                "emotional_state": "content",
                "short_term_goals": [],
            }
            for i, name, home in (
                (1, "Ada", "home-1"), (2, "Ben", "home-1"), (3, "Cleo", "home-2")
            )
        },
        "shop": {"location_id": "shop", "food": 30, "money": 0},
        "events": [{"id": 1, "tick": 0, "type": "world_created", "entity_ids": [], "details": {}}],
    }

    return initialize_spatial(state)


def validate(state, require_private_events=False):
    """Reject unsupported or inconsistent snapshots instead of silently reseeding."""
    def require(condition, message):
        if not condition:
            raise ValueError(message)

    def natural(value):
        return type(value) is int and value >= 0

    require(state["schema_version"] in (1, 2, 3, 4, 5, 6), "Unsupported save schema")
    clock = state["clock"]
    require(natural(clock["tick"]) and type(clock["running"]) is bool, "Invalid clock")
    locations = state["locations"]
    require(bool(locations), "Missing locations")
    for path in state["paths"].values():
        require(path["from"] in locations and path["to"] in locations, "Invalid path reference")
        require(type(path["bidirectional"]) is bool, "Invalid path direction")
    for citizen in state["citizens"].values():
        require(citizen["location_id"] in locations, "Invalid citizen location")
        require(citizen["home_id"] in locations, "Invalid home reference")
        require(locations[citizen["home_id"]]["kind"] == "home", "Home must reference a home")
        if state["schema_version"] >= 4:
            identity = citizen.get("identity")
            require(
                isinstance(identity, dict)
                and set(identity) == {"personality_traits", "personal_goal", "speaking_style"},
                "Invalid citizen identity",
            )
            traits = identity["personality_traits"]
            require(
                isinstance(traits, list)
                and 1 <= len(traits) <= MAX_PERSONALITY_TRAITS
                and all(
                    isinstance(trait, str)
                    and trait.strip()
                    and len(trait) <= MAX_TRAIT_LENGTH
                    for trait in traits
                ),
                "Invalid personality traits",
            )
            require(
                all(
                    isinstance(identity[field], str)
                    and identity[field].strip()
                    and len(identity[field]) <= MAX_IDENTITY_TEXT_LENGTH
                    for field in ("personal_goal", "speaking_style")
                ),
                "Invalid identity text",
            )
        for list_field in ("values", "fears", "habits", "long_term_goals"):
            if list_field in citizen:
                items = citizen[list_field]
                require(
                    isinstance(items, list)
                    and 1 <= len(items) <= MAX_IDENTITY_LIST_LENGTH
                    and all(
                        isinstance(item, str)
                        and item.strip()
                        and len(item) <= MAX_IDENTITY_TEXT_LENGTH
                        for item in items
                    ),
                    f"Invalid citizen {list_field}",
                )
        plan = citizen.get("current_plan")
        if plan is not None:
            require(
                isinstance(plan, dict)
                and set(plan) == {"summary", "started_tick"}
                and isinstance(plan["summary"], str)
                and plan["summary"].strip()
                and len(plan["summary"]) <= MAX_IDENTITY_TEXT_LENGTH
                and type(plan["started_tick"]) is int
                and 0 <= plan["started_tick"] <= clock["tick"],
                "Invalid current plan",
            )
        if "emotional_state" in citizen:
            require(
                citizen["emotional_state"] in EMOTIONAL_STATES,
                "Invalid emotional state",
            )
        if "short_term_goals" in citizen:
            goals = citizen["short_term_goals"]
            require(
                isinstance(goals, list)
                and len(goals) <= MAX_SHORT_TERM_GOALS
                and all(
                    isinstance(g, str) and g.strip()
                    and len(g) <= MAX_GOAL_TEXT_LENGTH
                    for g in goals
                ),
                "Invalid short-term goals",
            )
        if state["schema_version"] in (3, 4, 5, 6):
            needs = citizen.get("needs")
            require(
                isinstance(needs, dict) and set(needs) == {"hunger", "energy"},
                "Invalid citizen needs",
            )
            require(
                all(type(value) is int and 0 <= value <= 100 for value in needs.values()),
                "Invalid need value",
            )
            schedule = citizen.get("schedule")
            require(
                isinstance(schedule, dict)
                and set(schedule) == {
                    "regular_destination_id", "leave_home_hour", "return_home_hour",
                    "sleep_hour", "wake_hour",
                },
                "Invalid citizen schedule",
            )
            require(
                schedule["regular_destination_id"] in locations
                and schedule["regular_destination_id"] != citizen["home_id"],
                "Invalid regular destination",
            )
            require(
                all(
                    type(schedule[field]) is int and 0 <= schedule[field] < HOURS_PER_DAY
                    for field in ("leave_home_hour", "return_home_hour", "sleep_hour", "wake_hour")
                ),
                "Invalid schedule hour",
            )
            require(schedule["leave_home_hour"] < schedule["return_home_hour"], "Invalid away schedule")
            require(citizen.get("activity") in ACTIVITIES, "Invalid citizen activity")
    require(state["shop"]["location_id"] in locations, "Invalid shop reference")
    require(locations[state["shop"]["location_id"]]["kind"] == "shop", "Shop must reference a shop")
    for owner in [*state["citizens"].values(), state["shop"]]:
        require(natural(owner["food"]) and natural(owner["money"]), "Invalid resources")
    previous_id, previous_tick = 0, 0
    for event in state["events"]:
        require(type(event["id"]) is int and event["id"] > previous_id, "Invalid event order")
        require(natural(event["tick"]) and previous_tick <= event["tick"] <= clock["tick"], "Invalid event time")
        require(isinstance(event["type"], str) and isinstance(event["details"], dict), "Invalid event")
        require(isinstance(event["entity_ids"], list), "Invalid event entities")
        if event["type"] == "citizen_talked":
            require(event["details"] == {}, "Talk events cannot contain private details")
            require(
                len(event["entity_ids"]) == 2
                and all(citizen_id in state["citizens"] for citizen_id in event["entity_ids"])
                and event["entity_ids"][0] != event["entity_ids"][1],
                "Invalid talk event entities",
            )
        if event["type"] == "citizen_moved":
            require(
                len(event["entity_ids"]) == 1 and event["entity_ids"][0] in state["citizens"],
                "Invalid move event actor",
            )
            require(
                set(event["details"]) == {"from_location_id", "to_location_id"}
                and event["details"]["from_location_id"] in locations
                and event["details"]["to_location_id"] in locations,
                "Invalid move event details",
            )
        previous_id, previous_tick = event["id"], event["tick"]

    private_social = state.get("private_social", {})
    require(state["schema_version"] in (2, 3, 4, 5, 6) or not private_social, "Schema 1 cannot contain social state")
    require(isinstance(private_social, dict), "Invalid private social state")
    event_by_id = {event["id"]: event for event in state["events"]}
    citizens = state["citizens"]
    memory_event_ids = set()
    for owner_id, social in private_social.items():
        require(owner_id in citizens and isinstance(social, dict), "Invalid social state owner")
        require(set(social) == {"memories", "relationships", "beliefs"}, "Invalid social state")
        memories = social["memories"]
        relationships = social["relationships"]
        beliefs = social["beliefs"]
        require(isinstance(memories, list), "Invalid memories")
        require(isinstance(relationships, dict), "Invalid relationships")
        require(isinstance(beliefs, dict), "Invalid beliefs")

        previous_memory_id = 0
        for memory in memories:
            require(isinstance(memory, dict), "Invalid memory")
            require(type(memory.get("id")) is int and memory["id"] > previous_memory_id, "Invalid memory order")
            require(natural(memory.get("tick")) and memory["tick"] <= clock["tick"], "Invalid memory time")
            require(memory.get("type") == "message_received", "Invalid memory type")
            require(memory.get("actor_id") in citizens, "Invalid memory actor")
            message = memory.get("message")
            require(
                isinstance(message, str) and message.strip() and len(message) <= MAX_MESSAGE_LENGTH,
                "Invalid memory message",
            )
            intent = memory.get("intent")
            require(intent in TALK_INTENTS, "Invalid memory intent")
            subject_id = memory.get("subject_id")
            require((intent in REPORT_INTENTS) == (subject_id is not None), "Invalid memory subject")
            if subject_id is not None:
                require(subject_id in citizens and subject_id != owner_id, "Invalid memory subject")
            event = event_by_id.get(memory["id"])
            require(
                event is not None
                and event["type"] == "citizen_talked"
                and event["tick"] == memory["tick"]
                and event["entity_ids"] == [memory["actor_id"], owner_id],
                "Memory does not match its public event",
            )
            memory_event_ids.add(memory["id"])
            previous_memory_id = memory["id"]

        for subject_id, values in relationships.items():
            require(subject_id in citizens and subject_id != owner_id, "Invalid relationship subject")
            require(
                isinstance(values, dict) and set(values) == {"trust", "friendship", "anger"},
                "Invalid relationship",
            )
            require(
                all(type(value) is int and 0 <= value <= MAX_SOCIAL_VALUE for value in values.values()),
                "Invalid relationship value",
            )

        for subject_id, belief in beliefs.items():
            require(subject_id in citizens and subject_id != owner_id, "Invalid belief subject")
            require(
                isinstance(belief, dict)
                and set(belief) == {"helpful"}
                and type(belief["helpful"]) is bool,
                "Invalid belief",
            )
    if require_private_events:
        require(
            all(
                event["type"] != "citizen_talked" or event["id"] in memory_event_ids
                for event in state["events"]
            ),
            "Talk event is missing its private recipient memory",
        )

    private_ai = state.get("private_ai", {})
    require(state["schema_version"] >= 4 or not private_ai, "Older schemas cannot contain AI state")
    require(isinstance(private_ai, dict), "Invalid private AI state")
    for owner_id, ai_state in private_ai.items():
        require(owner_id in citizens and isinstance(ai_state, dict), "Invalid AI state owner")
        require(set(ai_state) == {"last_reply_tick_by_actor"}, "Invalid AI state")
        reply_ticks = ai_state["last_reply_tick_by_actor"]
        require(isinstance(reply_ticks, dict), "Invalid AI reply cooldowns")
        for actor_id, tick in reply_ticks.items():
            require(
                actor_id in citizens
                and actor_id != owner_id
                and natural(tick)
                and tick <= clock["tick"],
                "Invalid AI reply cooldown",
            )

    if state["schema_version"] >= 5:
        validate_spatial(state)
    if state["schema_version"] == 6:
        from population import validate_population
        validate_population(state)
        from institutions import validate_institutions
        validate_institutions(state)


def migrate(state):
    """Return a validated current-schema copy without discarding old world data."""
    original_version = state.get("schema_version")
    validate(state, require_private_events=original_version in (2, 3, 4, 5, 6))
    candidate = copy.deepcopy(state)
    candidate["schema_version"] = max(original_version, SCHEMA_VERSION)
    for citizen_id, citizen in candidate["citizens"].items():
        if original_version in (1, 2):
            citizen["needs"] = {"hunger": 0, "energy": 100}
            citizen["schedule"] = {
                "regular_destination_id": candidate["shop"]["location_id"],
                "leave_home_hour": 8,
                "return_home_hour": 18,
                "sleep_hour": 22,
                "wake_hour": 6,
            }
            citizen["activity"] = "resting"
        if original_version < 4:
            citizen["identity"] = default_identity(citizen_id)
        else:
            profile = default_profile(citizen_id, citizen.get("identity", {}).get("personal_goal", "Build a steady life in the neighborhood."))
            for k, v in profile.items():
                citizen.setdefault(k, copy.deepcopy(v))
        citizen.setdefault("current_plan", None)
        citizen.setdefault("emotional_state", "content")
        citizen.setdefault("short_term_goals", [])
    initialize_spatial(candidate)
    validate(candidate, require_private_events=True)
    return candidate


def write_snapshot(path, state):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(state, handle, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


class World(SpatialWorldMixin):
    def __init__(
        self,
        save_path,
        ai_brains=None,
        ai_timeout_seconds=AI_TIMEOUT_SECONDS,
        ai_reply_cooldown_ticks=AI_REPLY_COOLDOWN_TICKS,
    ):
        self._path = Path(save_path)
        self._lock = threading.RLock()
        if self._path.exists():
            with self._path.open(encoding="utf-8") as handle:
                loaded = json.load(handle)
            self._state = migrate(loaded)
            if self._state != loaded:
                write_snapshot(self._path, self._state)
        else:
            self._state = starter_world()
            self.save()
        if ai_brains is None:
            ai_brains = {}
        if not isinstance(ai_brains, dict):
            raise ValueError("AI brains must be a dictionary")
        if any(
            citizen_id not in self._state["citizens"] or not callable(getattr(brain, "decide", None))
            for citizen_id, brain in ai_brains.items()
        ):
            raise ValueError("Invalid citizen AI brain configuration")
        if (
            isinstance(ai_timeout_seconds, bool)
            or not isinstance(ai_timeout_seconds, (int, float))
            or not math.isfinite(ai_timeout_seconds)
            or ai_timeout_seconds <= 0
        ):
            raise ValueError("AI timeout must be positive")
        if type(ai_reply_cooldown_ticks) is not int or ai_reply_cooldown_ticks < 1:
            raise ValueError("AI reply cooldown must be a positive integer")
        self._scheduler = None
        self._ai_brains = dict(ai_brains)
        self._ai_timeout_seconds = float(ai_timeout_seconds)
        self._ai_reply_cooldown_ticks = ai_reply_cooldown_ticks
        from ai_reasoning import CharacterReasoningGateway
        self._ai_gateway = CharacterReasoningGateway(
            ai_brains=self._ai_brains,
            timeout_seconds=self._ai_timeout_seconds,
            cooldown_ticks=self._ai_reply_cooldown_ticks,
        )

    def snapshot(self):
        """Return an isolated public copy with all private social state removed."""
        with self._lock:
            public = copy.deepcopy(self._state)
            public.pop("private_social", None)
            public.pop("private_ai", None)
            public.pop("private_knowledge", None)
            return public

    def citizen_context(self, citizen_id):
        """Return one citizen's detached private context for trusted server-side use."""
        with self._lock:
            if citizen_id not in self._state["citizens"]:
                raise ValueError("Unknown citizen")
            social = self._state.get("private_social", {}).get(citizen_id)
            if social is None:
                social = {"memories": [], "relationships": {}, "beliefs": {}}
            return copy.deepcopy(social)

    def save(self):
        with self._lock:
            validate(self._state, require_private_events=True)
            write_snapshot(self._path, self._state)

    def _change(self, kind, *, running=None, ticks=0, only_if_running=False):
        with self._lock:
            if only_if_running and not self._state["clock"]["running"]:
                return
            if running is not None and self._state["clock"]["running"] == running:
                return
            candidate = copy.deepcopy(self._state)
            candidate["clock"]["tick"] += ticks
            if running is not None:
                candidate["clock"]["running"] = running
            events = candidate["events"]
            events.append({
                "id": events[-1]["id"] + 1 if events else 1,
                "tick": candidate["clock"]["tick"], "type": kind,
                "entity_ids": [], "details": {"ticks": ticks} if ticks else {},
            })
            validate(candidate, require_private_events=True)
            write_snapshot(self._path, candidate)
            self._state = candidate

    def start(self):
        self._change("clock_started", running=True)

    def pause(self):
        self._change("clock_paused", running=False)

    def advance(self, ticks=1):
        """Explicit deterministic hourly advancement, including while paused."""
        if type(ticks) is not int or ticks < 0:
            raise ValueError("ticks must be a nonnegative integer")
        for _ in range(ticks):
            self._advance_one_tick()
        if ticks:
            with self._lock:
                candidate = copy.deepcopy(self._state)
                events = candidate["events"]
                events.append({
                    "id": events[-1]["id"] + 1 if events else 1,
                    "tick": candidate["clock"]["tick"],
                    "type": "time_advanced",
                    "entity_ids": [],
                    "details": {"ticks": ticks},
                })
                validate(candidate, require_private_events=True)
                write_snapshot(self._path, candidate)
                self._state = candidate

    def tick_if_running(self):
        self._advance_one_tick(only_if_running=True)

    @staticmethod
    def _is_sleep_hour(hour, schedule):
        sleep_hour = schedule["sleep_hour"]
        wake_hour = schedule["wake_hour"]
        if sleep_hour < wake_hour:
            return sleep_hour <= hour < wake_hour
        return hour >= sleep_hour or hour < wake_hour

    @classmethod
    def choose_action(cls, state, citizen_id, private_social=None):
        """Choose one inspectable movement action from a detached state."""
        citizen = state["citizens"][citizen_id]
        if citizen.get("control") == "human":
            return None
        incident = state.get("spatial", {}).get("incident")
        if incident:
            if incident["citizen_id"] == citizen_id and incident["status"] != "recovered":
                return None
            if citizen_id in incident["witnesses"] and citizen_id != incident["citizen_id"]:
                patient = state["citizens"][incident["citizen_id"]]
                if incident["status"] == "needs_help" and distance(citizen["position"],patient["position"]) <= 90 and clear_segment(citizen["position"],patient["position"]):
                    return {"actor_id":citizen_id,"action_name":"assist","target_id":incident["citizen_id"]}
                if incident.get("helper_id") == citizen_id and citizen_id not in incident["reported_by"]:
                    if distance(citizen["position"],TOWN["places"]["police"]["anchor"]) <= 110:
                        return {"actor_id":citizen_id,"action_name":"report","target_id":"police"}
                    if citizen.get("destination_id") != "police":
                        return {"actor_id":citizen_id,"action_name":"move","target_id":"police"}
                    return None
        schedule = citizen["schedule"]
        location_id = citizen["location_id"]
        home_id = citizen["home_id"]
        hour = state["clock"]["tick"] % HOURS_PER_DAY
        energy = citizen["needs"]["energy"]
        if energy > LOW_ENERGY and state["clock"]["tick"] < citizen.get("plan_until_tick", 0):
            return None

        if energy <= LOW_ENERGY or (
            location_id == home_id
            and citizen["activity"] == "resting"
            and energy < RESTED_ENERGY
        ):
            destination_id = home_id
        elif cls._is_sleep_hour(hour, schedule) or not (
            schedule["leave_home_hour"] <= hour < schedule["return_home_hour"]
        ):
            destination_id = home_id
        else:
            destination_id = schedule["regular_destination_id"]
            relationships = (private_social or {}).get("relationships", {})
            strongly_distrusted = {
                subject_id
                for subject_id, values in relationships.items()
                if values.get("anger") == MAX_SOCIAL_VALUE and values.get("trust") == 0
            }
            if any(
                other_id in strongly_distrusted
                and other["location_id"] == destination_id
                for other_id, other in state["citizens"].items()
            ):
                destination_id = home_id

        if citizen.get("commitments") and energy > LOW_ENERGY:
            commitment = next((entry for entry in citizen["commitments"] if entry["start"] <= hour < entry["end"]), None)
            if commitment is None:
                from spatial import HOUR_SECONDS
                commitment = next((entry for entry in citizen["commitments"]
                    if hour < entry["start"] and entry["start"]-hour <=
                    math.ceil(distance(citizen["position"], destination_anchor(citizen_id,entry["place_id"])) /
                              (citizen.get("walking_speed",148)*HOUR_SECONDS))), None)
            destination_id = commitment["place_id"] if commitment else home_id

        if citizen.get("destination_id") == destination_id:
            return None
        anchor = destination_anchor(citizen_id,destination_id)
        if distance(citizen["position"], anchor) < 2:
            return None
        return {"actor_id": citizen_id, "action_name": "move", "target_id": destination_id}

    def _advance_one_tick(self, only_if_running=False, spatial_hour=False):
        with self._lock:
            if only_if_running and not self._state["clock"]["running"]:
                return
            candidate = copy.deepcopy(self._state)
            if spatial_hour:
                from spatial import HOUR_SECONDS
                candidate["spatial"]["hour_elapsed"] -= HOUR_SECONDS
            candidate["clock"]["tick"] += 1
            hour = candidate["clock"]["tick"] % HOURS_PER_DAY
            for citizen_id, citizen in candidate["citizens"].items():
                if citizen.get("control") == "human":
                    continue
                needs = citizen["needs"]
                needs["hunger"] = min(100, needs["hunger"] + 1)
                at_home = citizen["location_id"] == citizen["home_id"]
                sleeping = at_home and self._is_sleep_hour(hour, citizen["schedule"])
                if at_home:
                    needs["energy"] = min(100, needs["energy"] + (8 if sleeping else 4))
                else:
                    needs["energy"] = max(0, needs["energy"] - 3)
                incident = candidate.get("spatial", {}).get("incident")
                if incident and incident["citizen_id"] == citizen_id and incident["status"] != "recovered":
                    continue
                if citizen.get("route"):
                    citizen["activity"] = "travelling"
                elif sleeping:
                    citizen["activity"] = "sleeping"
                elif at_home:
                    citizen["activity"] = "resting"
                elif citizen["location_id"] == citizen["schedule"]["regular_destination_id"]:
                    citizen["activity"] = "at_regular_destination"
                else:
                    citizen["activity"] = "travelling"
            from institutions import update_institutions
            update_institutions(self, candidate)
            validate(candidate, require_private_events=True)
            write_snapshot(self._path, candidate)
            self._state = candidate
            for citizen_id in sorted(candidate["citizens"]):
                citizen = candidate["citizens"][citizen_id]
                if citizen.get("control") == "human":
                    continue
                handled = False
                brain = self._ai_brains.get(citizen_id)
                if brain and getattr(brain, "background_reasoning", False):
                    if self._scheduler is None:
                        from citizen_scheduler import CitizenScheduler
                        self._scheduler = CitizenScheduler(self)
                    self._scheduler.submit(citizen_id)
                    brain = None
                if brain and getattr(brain, "reasoning_brain", False) and self._ai_gateway.can_reason(citizen_id, candidate["clock"]["tick"]):
                    needs = citizen.get("needs", {})
                    if needs.get("energy", 100) <= LOW_ENERGY or needs.get("hunger", 0) >= HIGH_HUNGER:
                        req_type = "reconsider_plan"
                        reason = "needs threshold reached"
                    elif not citizen.get("route") and citizen.get("activity") in ("resting", "at_regular_destination"):
                        req_type = "perceive_and_decide"
                        reason = "idle between journeys"
                    else:
                        req_type = "perceive_and_decide"
                        reason = "tick routine"

                    decision = self._ai_gateway.request_decision(self, citizen_id, req_type, reason)
                    if decision.get("decision") != "none":
                        self._ai_gateway.execute_decision(self, citizen_id, decision)
                        handled = True

                if not handled:
                    social = self._state.get("private_social", {}).get(citizen_id)
                    action = self.choose_action(self._state, citizen_id, social)
                    if action is not None:
                        self.act(**action)

    def sync_citizen_movements(self):
        """Ensure all citizens whose schedule/commitment requires travel start moving immediately."""
        with self._lock:
            for cid in sorted(self._state["citizens"]):
                c = self._state["citizens"][cid]
                if c.get("control") == "human" or c.get("route"):
                    continue
                social = self._state.get("private_social", {}).get(cid)
                action = self.choose_action(self._state, cid, social)
                if action is not None:
                    try:
                        self.act(**action)
                    except ValueError:
                        pass

    def _ai_reply_is_ready(self, citizen_id, actor_id):
        with self._lock:
            last_tick = (
                self._state.get("private_ai", {})
                .get(citizen_id, {})
                .get("last_reply_tick_by_actor", {})
                .get(actor_id)
            )
            return (
                last_tick is None
                or actor_id == "player"
                or self._state["clock"]["tick"] - last_tick >= self._ai_reply_cooldown_ticks
            )

    def _build_ai_request(self, citizen_id, actor_id, incoming_event_id):
        """Build a detached request containing only this citizen's knowledge."""
        with self._lock:
            citizen = self._state["citizens"][citizen_id]
            actor = self._state["citizens"][actor_id]
            location = self._state["locations"][citizen["location_id"]]
            social = copy.deepcopy(
                self._state.get("private_social", {}).get(
                    citizen_id, {"memories": [], "relationships": {}, "beliefs": {}}
                )
            )
            social["observations"] = copy.deepcopy(self._state.get("private_knowledge", {}).get(citizen_id, [])[-10:])
            incoming = next(
                memory for memory in reversed(social["memories"])
                if memory["id"] == incoming_event_id
            )
            social["memories"] = social["memories"][-MAX_AI_CONTEXT_MEMORIES:]
            known_subject_ids = set(social["relationships"]) | set(social["beliefs"])
            known_subject_ids.update(
                memory["subject_id"]
                for memory in social["memories"]
                if "subject_id" in memory
            )
            allowed_subject_ids = sorted(known_subject_ids - {actor_id})
            incoming_details = {
                "speaker": {"id": actor_id, "name": actor["name"]},
                "message": incoming["message"],
                "intent": incoming["intent"],
            }
            if "subject_id" in incoming:
                subject_id = incoming["subject_id"]
                incoming_details["subject"] = {
                    "id": subject_id,
                    "name": self._state["citizens"][subject_id]["name"],
                }
            return {
                "citizen": {
                    "id": citizen_id,
                    "name": citizen["name"],
                    "identity": copy.deepcopy(citizen["identity"]),
                    "location": {
                        "id": citizen["location_id"],
                        "name": location["name"],
                        "kind": location["kind"],
                    },
                    "activity": citizen["activity"],
                    "needs": copy.deepcopy(citizen["needs"]),
                },
                "world": {
                    "tick": self._state["clock"]["tick"],
                    "hour": self._state["clock"]["tick"] % HOURS_PER_DAY,
                },
                "incoming": incoming_details,
                "private_context": social,
                "allowed_actions": [
                    {"action": "none"},
                    {
                        "action": "talk",
                        "target_id": actor_id,
                        "message_max_length": MAX_MESSAGE_LENGTH,
                        "intents": sorted(TALK_INTENTS - REPORT_INTENTS),
                        "report_intents": sorted(REPORT_INTENTS),
                        "report_subject_ids": allowed_subject_ids,
                    },
                ],
            }

    def _call_ai_brain(self, brain, request):
        """Return provider output or None after a strict wall-clock timeout."""
        results = queue.Queue(maxsize=1)

        def decide():
            try:
                results.put((True, brain.decide(copy.deepcopy(request))))
            except BaseException:
                results.put((False, None))

        thread = threading.Thread(target=decide, daemon=True, name="citizen-ai-brain")
        thread.start()
        try:
            succeeded, response = results.get(timeout=self._ai_timeout_seconds)
        except queue.Empty:
            return None
        return copy.deepcopy(response) if succeeded else None

    @staticmethod
    def _validate_ai_response(response, allowed_subject_ids):
        if not isinstance(response, dict) or response == {"action": "none"}:
            return None
        if response.get("action") != "talk":
            return None
        intent = response.get("intent")
        message = response.get("message")
        if (
            intent not in TALK_INTENTS
            or not isinstance(message, str)
            or not message.strip()
            or len(message) > MAX_MESSAGE_LENGTH
        ):
            return None
        if intent in REPORT_INTENTS:
            if set(response) != {"action", "message", "intent", "subject_id"}:
                return None
            if response["subject_id"] not in allowed_subject_ids:
                return None
            return message, {"intent": intent, "subject_id": response["subject_id"]}
        if set(response) != {"action", "message", "intent"}:
            return None
        return message, {"intent": intent}

    def _maybe_ai_reply(self, actor_id, citizen_id, incoming_event_id):
        brain = self._ai_brains.get(citizen_id)
        if brain is None or not self._ai_reply_is_ready(citizen_id, actor_id):
            return
        try:
            if getattr(brain, "reasoning_brain", False):
                with self._lock:
                    actor = self._state["citizens"][actor_id]
                    social = self._state.get("private_social", {}).get(citizen_id, {})
                    incoming_mem = next(
                        m for m in reversed(social.get("memories", []))
                        if m["id"] == incoming_event_id
                    )
                incoming_details = {
                    "speaker": {"id": actor_id, "name": actor["name"]},
                    "message": incoming_mem["message"],
                    "intent": incoming_mem.get("intent", "neutral"),
                }
                if getattr(brain, "background_reasoning", False):
                    if self._scheduler is None:
                        from citizen_scheduler import CitizenScheduler
                        self._scheduler = CitizenScheduler(self)
                    incoming_details["event_id"] = incoming_event_id
                    self._scheduler.submit(citizen_id, incoming_details)
                    return
                decision = self._ai_gateway.request_decision(
                    self, citizen_id, "respond_to_conversation",
                    reason=f"Spoken to by {actor_id}",
                    incoming=incoming_details,
                )
                if decision.get("decision") == "talk" and decision.get("message"):
                    decision["target_id"] = actor_id
                    self._ai_gateway.execute_decision(self, citizen_id, decision, reply_to=actor_id)
                return

            request = self._build_ai_request(citizen_id, actor_id, incoming_event_id)
            response = self._call_ai_brain(brain, request)
            allowed_subject_ids = request["allowed_actions"][1]["report_subject_ids"]
            reply = self._validate_ai_response(response, allowed_subject_ids)
            if reply is None:
                return
            reply_message, reply_params = reply
            self.act(
                citizen_id,
                "talk",
                actor_id,
                reply_message,
                reply_params,
                _ai_reply_to=actor_id,
            )
        except Exception:
            # The incoming talk is already committed. AI is strictly best-effort.
            return

    def act(
        self,
        actor_id,
        action_name,
        target_id=None,
        message=None,
        params=None,
        *,
        _ai_reply_to=None,
    ):
        """Validate and atomically apply an action shared by every kind of caller."""
        event = self._commit_action(
            actor_id, action_name, target_id, message, params, _ai_reply_to=_ai_reply_to
        )
        if action_name == "talk" and _ai_reply_to is None:
            self._maybe_ai_reply(actor_id, target_id, event["id"])
        return event

    def _commit_action(
        self,
        actor_id,
        action_name,
        target_id=None,
        message=None,
        params=None,
        *,
        _ai_reply_to=None,
    ):
        """Validate and atomically apply an action shared by every kind of caller."""
        with self._lock:
            citizens = self._state["citizens"]
            if not isinstance(actor_id, str) or actor_id not in citizens:
                raise ValueError("Unknown actor")
            if not isinstance(action_name, str) or action_name not in {"talk", "move", "steer", "engage", "disengage", "assist", "report", "wait", "rest", "eat", "work"}:
                raise ValueError("Unsupported action")
            if action_name != "talk":
                if _ai_reply_to is not None:
                    raise ValueError("Only talk can be an AI reply")
                return self._spatial_action(actor_id, action_name, target_id, message, params)

            if not isinstance(target_id, str) or target_id not in citizens:
                raise ValueError("Unknown target")
            if actor_id == target_id:
                raise ValueError("A citizen cannot target themselves with talk")
            self._check_talk_range(actor_id, target_id)
            if _ai_reply_to is not None:
                if _ai_reply_to != target_id:
                    raise ValueError("AI reply target does not match")
                last_tick = (
                    self._state.get("private_ai", {})
                    .get(actor_id, {})
                    .get("last_reply_tick_by_actor", {})
                    .get(target_id)
                )
                if (
                    target_id != "player"
                    and last_tick is not None
                    and self._state["clock"]["tick"] - last_tick
                    < self._ai_reply_cooldown_ticks
                ):
                    raise ValueError("AI reply is on cooldown")
            if not isinstance(message, str) or not message.strip():
                raise ValueError("Message must contain text")
            if len(message) > MAX_MESSAGE_LENGTH:
                raise ValueError(f"Message must be at most {MAX_MESSAGE_LENGTH} characters")
            if params is None:
                params = {}
            if not isinstance(params, dict):
                raise ValueError("Action parameters must be a dictionary")
            if not set(params) <= {"intent", "subject_id"}:
                raise ValueError("Unsupported action parameter")
            intent = params.get("intent", "neutral")
            if not isinstance(intent, str) or intent not in TALK_INTENTS:
                raise ValueError("Unsupported talk intent")
            subject_id = params.get("subject_id")
            if intent in REPORT_INTENTS:
                if not isinstance(subject_id, str) or subject_id not in citizens:
                    raise ValueError("Report intent requires a known subject citizen")
                if subject_id == target_id:
                    raise ValueError("A citizen cannot receive a belief about themselves")
            elif subject_id is not None:
                raise ValueError("This talk intent does not accept a subject")

            candidate = copy.deepcopy(self._state)
            event_id = candidate["events"][-1]["id"] + 1 if candidate["events"] else 1
            tick = candidate["clock"]["tick"]
            social = candidate.setdefault("private_social", {}).setdefault(
                target_id, {"memories": [], "relationships": {}, "beliefs": {}}
            )
            memory = {
                "id": event_id,
                "tick": tick,
                "type": "message_received",
                "actor_id": actor_id,
                "message": message,
                "intent": intent,
            }
            if subject_id is not None:
                memory["subject_id"] = subject_id
            social["memories"].append(memory)

            relationship_subject = actor_id
            changed_value = None
            if intent == "confide":
                changed_value = "trust"
            elif intent == "encourage":
                changed_value = "friendship"
            elif intent == "insult":
                changed_value = "anger"
            elif intent in REPORT_INTENTS:
                relationship_subject = subject_id
                changed_value = "trust" if intent == "report_help" else "anger"
                social["beliefs"][subject_id] = {"helpful": intent == "report_help"}
            if changed_value is not None:
                relationship = social["relationships"].setdefault(
                    relationship_subject, {"trust": 0, "friendship": 0, "anger": 0}
                )
                relationship[changed_value] = min(
                    MAX_SOCIAL_VALUE, relationship[changed_value] + 1
                )

            event = {
                "id": event_id,
                "tick": tick,
                "type": "citizen_talked",
                "entity_ids": [actor_id, target_id],
                "details": {},
            }
            candidate["events"].append(event)
            if _ai_reply_to is not None:
                ai_state = candidate.setdefault("private_ai", {}).setdefault(
                    actor_id, {"last_reply_tick_by_actor": {}}
                )
                ai_state["last_reply_tick_by_actor"][target_id] = tick
            self._publish_candidate(candidate)
            return copy.deepcopy(event)

    def interrupt_citizen(self, citizen_id, reason="interrupted"):
        """Cancel a citizen's active journey/plan and trigger immediate AI reconsideration."""
        with self._lock:
            citizen = self._state["citizens"].get(citizen_id)
            if not citizen:
                raise ValueError("Unknown citizen")
            citizen["route"] = []
            citizen["destination_id"] = None
            citizen["current_plan"] = None
            self.save()

        if hasattr(self, "_ai_gateway") and self._ai_gateway.has_brain(citizen_id) and getattr(self._ai_brains.get(citizen_id), "reasoning_brain", False):
            decision = self._ai_gateway.request_decision(
                self, citizen_id, "reconsider_plan", reason=reason,
            )
            if decision.get("decision") != "none":
                return self._ai_gateway.execute_decision(self, citizen_id, decision)
        return None
