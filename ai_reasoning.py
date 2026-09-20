"""Central reasoning gateway, citizen context builder, and response validator.

Every AI citizen's behavior is produced by its own reasoning through LM Studio
or a deterministic test provider. The AI proposes decisions; the simulation engine
validates and executes them through World.act(...).
"""

import copy
import json
import logging
import math
import queue
import threading
import time
import uuid
from typing import Any, Dict, List, Mapping, Optional

from town import TOWN, distance, clear_segment
from world import (
    MAX_MESSAGE_LENGTH,
    MAX_SOCIAL_VALUE,
    MAX_AI_CONTEXT_MEMORIES,
    EMOTIONAL_STATES,
    SOCIAL_TAGS,
    SOCIAL_TAG_EFFECTS,
    MAX_SOCIAL_TAGS_PER_RESPONSE,
    AI_TIMEOUT_SECONDS,
)

logger = logging.getLogger(__name__)

DECISION_TYPES = frozenset({
    "move", "talk", "wait", "rest", "eat", "work",
    "investigate", "follow", "avoid", "none",
})

REQUEST_TYPES = frozenset({
    "perceive_and_decide",
    "respond_to_conversation",
    "react_to_event",
    "reconsider_plan",
})

ALLOWED_RESPONSE_FIELDS = frozenset({
    "decision",
    "target_id",
    "destination_id",
    "message",
    "social_tags",
    "plan_summary",
    "emotional_state",
    "memory_candidate",
    "should_reconsider_at_tick",
})

PERCEPTION_RANGE = 220.0
TALK_DISTANCE = 90.0


class FakeReasoningBrain:
    """Deterministic, scriptable AI provider for automated testing.
    
    Records all incoming requests and returns scripted decisions.
    Never makes external network calls.
    """
    reasoning_brain = True

    def __init__(self, responses: Optional[List[dict]] = None, delay: float = 0.0, error: Optional[Exception] = None):
        self.responses = list(responses or [])
        self.requests_received: List[dict] = []
        self.delay = delay
        self.error = error

    def decide(self, request: Mapping[str, Any]) -> dict:
        self.requests_received.append(copy.deepcopy(dict(request)))
        if self.delay > 0:
            time.sleep(self.delay)
        if self.error:
            raise self.error
        if self.responses:
            return copy.deepcopy(self.responses.pop(0))
        return {"decision": "none"}


def calculate_perception(state: dict, citizen_id: str) -> dict:
    """Calculate citizen-scoped perception based on physical location and line of sight.
    
    A citizen can only perceive entities within range with unobstructed vision.
    Never leaks another citizen's private state, memories, beliefs, or goals.
    """
    citizen = state["citizens"][citizen_id]
    pos = citizen.get("position", {"x": 0, "y": 0})

    visible_citizens = []
    for other_id, other in state["citizens"].items():
        if other_id == citizen_id:
            continue
        other_pos = other.get("position", {"x": 0, "y": 0})
        dist = distance(pos, other_pos)
        if dist <= PERCEPTION_RANGE and clear_segment(pos, other_pos):
            dist_label = "near" if dist <= TALK_DISTANCE else ("medium" if dist <= 160 else "far")
            visible_citizens.append({
                "id": other_id,
                "name": other["name"],
                "activity": other.get("activity", "resting"),
                "distance": dist_label,
            })

    visible_citizens.sort(key=lambda c: c["id"])

    visible_places = []
    for place_id, place in TOWN["places"].items():
        anchor = place.get("anchor", {"x": 0, "y": 0})
        if distance(pos, anchor) <= PERCEPTION_RANGE:
            visible_places.append(place_id)
    if citizen.get("location_id") and citizen["location_id"] not in visible_places:
        visible_places.append(citizen["location_id"])
    visible_places.sort()

    knowledge = state.get("private_knowledge", {}).get(citizen_id, [])
    recent_events = [
        {"tick": obs["tick"], "text": obs["text"]}
        for obs in knowledge[-10:]
    ]

    return {
        "visible_citizens": visible_citizens,
        "visible_places": visible_places,
        "recent_events": recent_events,
    }


def build_reasoning_request(
    state: dict,
    citizen_id: str,
    request_type: str,
    reason: str,
    incoming: Optional[dict] = None,
) -> dict:
    """Build a strictly citizen-scoped reasoning request.
    
    The request contains ONLY information this citizen personally knows:
    their identity, dynamic state, private memories, beliefs, relationships,
    and what they currently perceive. Global state and other citizens' private
    data are strictly excluded.
    """
    if citizen_id not in state["citizens"]:
        raise ValueError(f"Unknown citizen: {citizen_id}")
    if request_type not in REQUEST_TYPES:
        raise ValueError(f"Unknown request type: {request_type}")

    citizen = state["citizens"][citizen_id]
    clock = state["clock"]
    hour = clock["tick"] % 24
    if 6 <= hour < 12:
        time_of_day = "morning"
    elif 12 <= hour < 17:
        time_of_day = "afternoon"
    elif 17 <= hour < 22:
        time_of_day = "evening"
    else:
        time_of_day = "night"

    loc_id = citizen.get("location_id", "street")
    loc_info = state["locations"].get(loc_id, {"name": loc_id, "kind": "street"})

    social = copy.deepcopy(
        state.get("private_social", {}).get(
            citizen_id, {"memories": [], "relationships": {}, "beliefs": {}}
        )
    )
    social["memories"] = social.get("memories", [])[-MAX_AI_CONTEXT_MEMORIES:]

    perception = calculate_perception(state, citizen_id)
    known_destinations = sorted(TOWN["places"].keys())
    if request_type == "respond_to_conversation":
        known_destinations = sorted({loc_id, citizen["home_id"], citizen["schedule"]["regular_destination_id"]})
        social["memories"] = social["memories"][-8:]

    citizen_data = {
        "id": citizen_id,
        "name": citizen["name"],
        "identity": copy.deepcopy(citizen.get("identity", {})),
        "values": copy.deepcopy(citizen.get("values", [])),
        "fears": copy.deepcopy(citizen.get("fears", [])),
        "habits": copy.deepcopy(citizen.get("habits", [])),
        "long_term_goals": copy.deepcopy(citizen.get("long_term_goals", [])),
        "short_term_goals": copy.deepcopy(citizen.get("short_term_goals", [])),
        "location": {
            "id": loc_id,
            "name": loc_info.get("name", loc_id),
            "kind": loc_info.get("kind", "street"),
        },
        "occupation": citizen.get("occupation", "resident"),
        "schedule": copy.deepcopy(citizen.get("commitments", [])),
        "activity": citizen.get("activity", "resting"),
        "needs": copy.deepcopy(citizen.get("needs", {"hunger": 0, "energy": 100})),
        "emotional_state": citizen.get("emotional_state", "content"),
        "current_plan": copy.deepcopy(citizen.get("current_plan")),
    }

    req = {
        "request_id": str(uuid.uuid4()),
        "request_type": request_type,
        "reason": str(reason),
        "citizen": citizen_data,
        "world": {
            "tick": clock["tick"],
            "hour": hour,
            "time_of_day": time_of_day,
        },
        "perception": perception,
        "private_context": social,
        "known_destinations": known_destinations,
        "available_actions": sorted(DECISION_TYPES),
        "available_social_tags": sorted(SOCIAL_TAGS),
        "available_emotional_states": sorted(EMOTIONAL_STATES),
        "incoming": copy.deepcopy(incoming) if incoming else None,
    }

    return req


def validate_reasoning_response(response: Any, request: dict) -> dict:
    """Validate and sanitize untrusted AI model output.
    
    Enforces the strict JSON response schema:
    - Rejects unknown fields -> safe 'none' result.
    - Rejects unknown decisions -> safe 'none' result.
    - Rejects destinations not in known_destinations -> safe 'none' result.
    - Rejects targets that are not visible or known -> safe 'none' result.
    - Rejects messages above MAX_MESSAGE_LENGTH -> safe 'none' result.
    - Rejects malformed JSON or invalid types -> safe 'none' result.
    - Social tags must use fixed allowlist; drops invalid tags.
    - Never allows arbitrary numeric changes.
    """
    fallback = {"decision": "none"}

    if not isinstance(response, dict):
        return fallback

    # Allow legacy Phase 4 fields for backwards compatibility
    legacy_fields = {"action", "intent", "subject_id"}
    all_allowed = ALLOWED_RESPONSE_FIELDS | legacy_fields
    if not set(response.keys()).issubset(all_allowed):
        return fallback

    normalized = dict(response)
    if "action" in normalized and "decision" not in normalized:
        normalized["decision"] = normalized.pop("action")
    if "intent" in normalized and "social_tags" not in normalized:
        intent = normalized.get("intent")
        intent_map = {
            "confide": ["friendly"],
            "encourage": ["friendly"],
            "insult": ["angry"],
            "report_help": ["grateful"],
            "report_harm": ["angry"],
        }
        normalized["social_tags"] = intent_map.get(intent, [])

    decision = normalized.get("decision")
    if not isinstance(decision, str) or decision not in DECISION_TYPES:
        return fallback

    if decision == "none":
        return fallback

    # Target validation
    target_id = normalized.get("target_id")
    visible_ids = {c["id"] for c in request.get("perception", {}).get("visible_citizens", [])}
    if request.get("incoming") and request["incoming"].get("speaker"):
        visible_ids.add(request["incoming"]["speaker"]["id"])

    if target_id is not None:
        if not isinstance(target_id, str) or target_id not in visible_ids:
            return fallback
    elif decision == "talk" and request.get("incoming") and request["incoming"].get("speaker"):
        target_id = request["incoming"]["speaker"]["id"]

    # Destination validation
    destination_id = normalized.get("destination_id")
    if destination_id is not None:
        if not isinstance(destination_id, str) or destination_id not in request.get("known_destinations", []):
            return fallback

    # Action-specific requirements
    if decision == "move":
        if not destination_id:
            return fallback
    elif decision == "talk":
        if not target_id:
            return fallback
        msg = normalized.get("message")
        if not isinstance(msg, str) or not msg.strip() or len(msg) > MAX_MESSAGE_LENGTH:
            return fallback
    elif decision in {"follow", "avoid"}:
        if not target_id:
            return fallback
    elif decision in {"wait", "rest", "eat", "work", "investigate"}:
        pass

    message = normalized.get("message")
    if message is not None:
        if not isinstance(message, str) or len(message) > MAX_MESSAGE_LENGTH or decision != "talk":
            message = None
        else:
            message = message.strip()
            if not message:
                message = None

    social_tags = []
    if "social_tags" in normalized:
        raw_tags = normalized["social_tags"]
        if not isinstance(raw_tags, list):
            return fallback
        for tag in raw_tags:
            if isinstance(tag, str) and tag in SOCIAL_TAGS and tag not in social_tags:
                social_tags.append(tag)
            if len(social_tags) >= MAX_SOCIAL_TAGS_PER_RESPONSE:
                break

    if "plan_summary" in normalized:
        plan_summary = normalized["plan_summary"]
        if plan_summary is not None:
            if not isinstance(plan_summary, str) or len(plan_summary) > 160:
                return fallback
            plan_summary = plan_summary.strip() or None
    else:
        plan_summary = None

    if "emotional_state" in normalized:
        emotional_state = normalized["emotional_state"]
        if emotional_state is not None:
            if not isinstance(emotional_state, str) or emotional_state not in EMOTIONAL_STATES:
                return fallback
    else:
        emotional_state = None

    if "memory_candidate" in normalized:
        memory_candidate = normalized["memory_candidate"]
        if memory_candidate is not None:
            if not isinstance(memory_candidate, str) or len(memory_candidate) > 200:
                return fallback
            memory_candidate = memory_candidate.strip() or None
    else:
        memory_candidate = None

    current_tick = request.get("world", {}).get("tick", 0)
    if "should_reconsider_at_tick" in normalized:
        reconsider_tick = normalized["should_reconsider_at_tick"]
        if reconsider_tick is not None:
            if type(reconsider_tick) is not int or reconsider_tick < current_tick:
                return fallback
    else:
        reconsider_tick = None

    return {
        "decision": decision,
        "target_id": target_id,
        "destination_id": destination_id,
        "message": message,
        "social_tags": social_tags,
        "plan_summary": plan_summary,
        "emotional_state": emotional_state,
        "memory_candidate": memory_candidate,
        "should_reconsider_at_tick": reconsider_tick,
    }


def filter_and_save_memory(world, citizen_id: str, candidate_text: Optional[str]):
    """Evaluate and optionally persist a proposed memory candidate.
    
    Only meaningful observations are saved to private_knowledge.
    Trivial or duplicate candidates are discarded.
    """
    if not candidate_text or not isinstance(candidate_text, str):
        return
    text = candidate_text.strip()
    if len(text) < 5 or text.lower() in {"none", "nothing", "n/a", "no", "ok"}:
        return

    with world._lock:
        knowledge = world._state.get("private_knowledge", {}).get(citizen_id, [])
        if knowledge and knowledge[-1].get("text") == text:
            return
        loc_id = world._state["citizens"][citizen_id].get("location_id", "street")
        world._observe(world._state, citizen_id, text, loc_id)


def apply_social_tags(world, actor_id: str, target_id: str, social_tags: List[str]):
    """Apply bounded relationship shifts driven by validated social tags.
    
    The model never returns raw numbers; the engine maps fixed tags
    to ±1 bounded shifts clamped between 0 and MAX_SOCIAL_VALUE.
    """
    if not target_id or not actor_id or not social_tags:
        return

    with world._lock:
        for owner, other in ((target_id, actor_id), (actor_id, target_id)):
            social = world._state.setdefault("private_social", {}).setdefault(
                owner, {"memories": [], "relationships": {}, "beliefs": {}}
            )
            rel = social["relationships"].setdefault(
                other, {"trust": 0, "friendship": 0, "anger": 0}
            )

            for tag in social_tags:
                effect = SOCIAL_TAG_EFFECTS.get(tag)
                if effect is not None:
                    field, delta = effect
                    current = rel.get(field, 0)
                    rel[field] = max(0, min(MAX_SOCIAL_VALUE, current + delta))


class CharacterReasoningGateway:
    """Central gateway for all AI character reasoning requests.
    
    One unified gateway coordinates:
    - Context building with citizen-scoped knowledge
    - Provider invocation with strict thread isolation and timeout
    - Schema validation and rejection of invalid output
    - Execution of accepted decisions strictly through World.act(...)
    - Rate limiting, cooldowns, and decision queuing
    - Graceful fallback when AI is unavailable or fails
    """

    def __init__(
        self,
        ai_brains: Optional[Mapping[str, Any]] = None,
        timeout_seconds: float = AI_TIMEOUT_SECONDS,
        cooldown_ticks: int = 1,
        decision_budget_per_tick: int = 2,
    ):
        self.brains = dict(ai_brains or {})
        self.timeout_seconds = float(timeout_seconds)
        self.cooldown_ticks = int(cooldown_ticks)
        self.decision_budget_per_tick = int(decision_budget_per_tick)
        self._last_decision_tick: Dict[str, int] = {}
        self._decisions_this_tick = 0
        self._current_tick = -1
        self._lock = threading.Lock()

    def has_brain(self, citizen_id: str) -> bool:
        return citizen_id in self.brains

    def can_reason(self, citizen_id: str, tick: int) -> bool:
        """Check if this citizen is eligible for a new reasoning request."""
        if citizen_id not in self.brains:
            return False
        with self._lock:
            if tick != self._current_tick:
                self._current_tick = tick
                self._decisions_this_tick = 0

            if self._decisions_this_tick >= self.decision_budget_per_tick:
                return False

            last = self._last_decision_tick.get(citizen_id)
            if last is not None and (tick - last) < self.cooldown_ticks:
                return False

            return True

    def _call_brain(self, brain: Any, request: dict) -> Optional[dict]:
        """Invoke brain.decide with wall-clock timeout and thread isolation."""
        res_q = queue.Queue(maxsize=1)

        def run():
            try:
                out = brain.decide(copy.deepcopy(request))
                res_q.put((True, out))
            except BaseException as e:
                res_q.put((False, None))

        thread = threading.Thread(target=run, daemon=True, name="character-reasoning")
        thread.start()
        try:
            ok, response = res_q.get(timeout=self.timeout_seconds)
            return response if ok else None
        except queue.Empty:
            logger.warning(f"Brain timeout after {self.timeout_seconds}s")
            return None

    def request_decision(
        self,
        world,
        citizen_id: str,
        request_type: str,
        reason: str,
        incoming: Optional[dict] = None,
    ) -> dict:
        """Run the full reasoning pipeline: build context -> call provider -> validate output.
        
        Returns a validated decision dict (or {"decision": "none"} on any failure).
        """
        brain = self.brains.get(citizen_id)
        if brain is None:
            return {"decision": "none"}

        with world._lock:
            state = copy.deepcopy(world._state)

        request = build_reasoning_request(state, citizen_id, request_type, reason, incoming)
        raw_response = self._call_brain(brain, request)

        if raw_response is None:
            return {"decision": "none"}

        validated = validate_reasoning_response(raw_response, request)

        with self._lock:
            self._last_decision_tick[citizen_id] = state["clock"]["tick"]
            self._decisions_this_tick += 1

        return validated

    def execute_decision(self, world, citizen_id: str, decision: dict, reply_to=None) -> Optional[dict]:
        """Stage the action and private effects, then publish one atomic save."""
        action = decision.get("decision", "none")
        if action == "none":
            return None
        with world._lock:
            staged = copy.copy(world)
            staged._state = copy.deepcopy(world._state)
            staged._inputs = copy.deepcopy(getattr(world, "_inputs", {}))
            staged._conversations = copy.deepcopy(getattr(world, "_conversations", {}))
            def publish(candidate, persist=True):
                staged._state = candidate
            staged._publish_candidate = publish
            target = decision.get("target_id")
            destination = decision.get("destination_id")
            if action in {"move", "investigate"}:
                event = staged._commit_action(citizen_id, "move", destination)
            elif action == "avoid":
                event = staged._commit_action(citizen_id, "move", staged._state["citizens"][citizen_id]["home_id"])
            elif action == "follow":
                other = staged._state["citizens"].get(target)
                if not other or not staged._near(staged._state["citizens"][citizen_id], other):
                    raise ValueError("Target is no longer nearby")
                event = staged._commit_action(citizen_id, "move", params=dict(other["position"]))
            elif action == "talk":
                # Commit directly: an AI reply never recursively calls another brain.
                event = staged._commit_action(citizen_id, "talk", target, decision.get("message"), _ai_reply_to=reply_to)
            else:
                event = staged._commit_action(citizen_id, action)
            citizen = staged._state["citizens"][citizen_id]
            if action != "talk":
                tick = staged._state["clock"]["tick"]
                citizen["plan_until_tick"] = min(tick+3, max(tick+1, decision.get("should_reconsider_at_tick") or tick+1))
            if decision.get("plan_summary"):
                citizen["current_plan"] = {"summary": decision["plan_summary"], "started_tick": staged._state["clock"]["tick"]}
            if decision.get("emotional_state"):
                citizen["emotional_state"] = decision["emotional_state"]
            if decision.get("memory_candidate"):
                staged._observe(staged._state, citizen_id, "Personal reflection: " + decision["memory_candidate"], citizen["location_id"])
            if target and action == "talk":
                social = staged._state.setdefault("private_social", {}).setdefault(citizen_id, {"memories": [], "relationships": {}, "beliefs": {}})
                rel = social["relationships"].setdefault(target, {"trust": 0, "friendship": 0, "anger": 0})
                for tag in decision.get("social_tags", []):
                    effect = SOCIAL_TAG_EFFECTS.get(tag)
                    if effect:
                        field, delta = effect
                        rel[field] = max(0, min(MAX_SOCIAL_VALUE, rel[field]+delta))
            world._publish_candidate(staged._state)
            return event
