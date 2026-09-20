# Phase 6 — AI Character Reasoning Layer

## Delivered

- **Full AI Character Reasoning Layer**: Citizens are fully realized autonomous agents whose behavior—movement, dialogue, social attitude, emotional state, memory retention, and plan updates—is produced by their own reasoning.
- **Local LM Studio Integration (`lm_studio.py`)**: Connects directly to LM Studio's local OpenAI-compatible endpoint (`http://localhost:1234/v1/chat/completions`) using Python standard library only (`urllib.request`). Zero external Python packages.
- **Zero Hard-Coded Models**: Completely configurable via environment variables (`WILLOW_AI_MODEL`, `WILLOW_AI_BASE_URL`, `WILLOW_AI_TIMEOUT`, etc.). No vendor lock-in or cloud model dependencies.
- **Central Reasoning Gateway (`ai_reasoning.py`)**: One unified `CharacterReasoningGateway` coordinates perception calculation, context assembly, model invocation, rigid schema validation, and safe action execution.
- **Four Distinct Reasoning Triggers**:
  1. `perceive_and_decide`: Periodic or need-driven assessment of surrounding environment, citizens, places, and goals.
  2. `respond_to_conversation`: Interactive reasoning when spoken to by the player or another citizen.
  3. `react_to_event`: Immediate evaluation of perceived incidents (e.g., witnessing a citizen fall or seek medical aid).
  4. `reconsider_plan`: Re-evaluating current commitments upon interruption, route completion, or significant status change.
- **Rich Data-Driven Character State**: Extended citizen model with `values`, `fears`, `habits`, `long_term_goals`, `short_term_goals`, `current_plan`, and `emotional_state`, while maintaining schema version compatibility (`SCHEMA_VERSION = 5`).
- **Spatial Perception Engine**: Filters visible citizens and places by radial distance and line-of-sight, contextualizing decisions within the town map.
- **Strict Response Validation & Sanitization**: Comprehensive validation ensures all LLM outputs match a rigid JSON schema. Malformed keys, hallucinated destinations, out-of-range values, or invalid actions safely default to `"decision": "none"` without crashing or corrupting simulation state.
- **Bounded Social Tag Dynamics**: Structured social reactions (`friendly`, `suspicious`, `grateful`, `angry`, `fearful`, `interested`, `dismissive`) map to deterministic, bounded relationship shifts clamped to `[0, 5]`.
- **Private Memory Formation**: Citizens form private, filtered memories from significant interactions and observations without leaking to other citizens or public broadcasts.
- **Deterministic Offline Simulation**: Graceful fallback ensures the simulation continues seamlessly via authored daily routines if LM Studio is offline, unconfigured, or times out.
- **Zero-Dependency CI & Comprehensive Testing**: Complete deterministic test suite with `FakeReasoningBrain` across 17 dedicated reasoning tests, maintaining 100% pass rate across all 76 project tests.

---

## Architecture

The reasoning architecture sits between the simulation loop (`world.py`), spatial navigation (`town.py`, `spatial.py`), and the local inference engine (`lm_studio.py`).

```
                    +----------------------------------+
                    |           World Clock            |
                    +-----------------+----------------+
                                      |
                                      v
+---------------------------------------------------------------------+
|                      CharacterReasoningGateway                      |
|                                                                     |
|  1. Trigger Check (cooldown, budget, needs, events, dialogue)      |
|  2. Perception Calculation (distance, LOS, visible entities)       |
|  3. Context Assembly (profile, memories, relationships, beliefs)    |
|  4. Model Dispatch (LMStudioBrain / FakeReasoningBrain)             |
|  5. Response Validation & Sanitization (strict schema check)       |
|  6. Effect Execution (act, social tags, memories, emotional state)  |
+-------------------+-----------------------------+-------------------+
                    |                             |
                    v                             v
       +-------------------------+   +-------------------------+
       |   World & Spatial Act   |   |  Private Social State   |
       |  (move, talk, wait...)  |   | (memories, tags, trust) |
       +-------------------------+   +-------------------------+
```

### Components

1. **`ai_reasoning.py`**:
   - `CharacterReasoningGateway`: Orchestrates decision requests, handles concurrency limits, cooldowns, and action execution.
   - `build_reasoning_request`: Assembles a complete, private snapshot of the character's perception and internal state.
   - `validate_reasoning_response`: Enforces schema constraints, destination existence, action validity, and parameter bounds.
   - `calculate_perception`: Computes visible citizens (within 1,500 units) and visible places (within 2,500 units).
   - `apply_social_tags`: Translates validated social tags into bounded relationship adjustments (`trust`, `friendship`, `respect`).
   - `filter_and_save_memory`: Stores meaningful episodic memories from character reasoning.
   - `FakeReasoningBrain`: Deterministic test mock supporting scripted queue responses, failure modes, and latency simulation.

2. **`lm_studio.py`**:
   - `LMStudioConfig`: Dataclass parsing environment variables with sensible defaults.
   - `LMStudioBrain`: Concrete `CitizenBrain` communicating with LM Studio's `/v1/chat/completions` API via `urllib.request`. Features startup health checks (`/v1/models`), JSON mode request formatting, markdown fence stripping, single transport retry, and timeout guards.
   - `create_brains_from_env`: Factory initializing one `LMStudioBrain` per citizen if `WILLOW_AI_MODEL` is set.

3. **`world.py` Integration**:
   - Extended `Citizen` initialization with starter profiles (`STARTER_PROFILES` for Cleo, Dale, and Bob).
   - Periodic decision evaluations in `_advance_one_tick` when citizens are idle or need thresholds are crossed.
   - Dialogue reasoning hook in `_maybe_ai_reply` executing `respond_to_conversation`.
   - Event interruption hook via `interrupt_citizen(citizen_id, reason)` triggering `reconsider_plan`.

---

## Character State Model

Citizens possess a multi-layered character representation:

| Attribute | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `values` | `list[str]` | Core guiding ethical and lifestyle principles | `["community", "order", "helping others"]` |
| `fears` | `list[str]` | Situations or outcomes the citizen avoids | `["isolation", "medical emergencies"]` |
| `habits` | `list[str]` | Routine daily patterns and preferences | `["visits grocer daily", "early riser"]` |
| `long_term_goals` | `list[str]` | Overarching life objectives | `["maintain Corner Grocer", "keep town connected"]`|
| `short_term_goals` | `list[str]` | Immediate tasks or desires | `["reach Town Square", "check on neighbor"]` |
| `current_plan` | `dict \| None`| Active reasoned intention and expiry tick | `{"destination_id": "park", "summary": "relax"}` |
| `emotional_state` | `str` | Current mood from `EMOTIONAL_STATES` | `"content"`, `"anxious"`, `"suspicious"` |
| `needs` | `dict[str, int]` | Physical drives (`hunger`, `energy`, `social`) | `{"energy": 60, "hunger": 20, "social": 80}` |
| `private_social` | `dict` | Private memories, beliefs, and relationships | Clamped scores `[0, 5]` for trust, friendship |

Allowed emotional states: `neutral`, `happy`, `content`, `anxious`, `fearful`, `angry`, `suspicious`, `curious`, `exhausted`, `grateful`.

---

## Reasoning Protocol

### Request Schema

When invoking the reasoning brain, the gateway provides a comprehensive prompt structured as follows:

```json
{
  "request_type": "perceive_and_decide | respond_to_conversation | react_to_event | reconsider_plan",
  "reason": "Human-readable trigger reason",
  "citizen": {
    "id": "citizen-1",
    "name": "Cleo",
    "location_id": "grocer",
    "position": {"x": 5400, "y": 4800},
    "activity": "idle",
    "needs": {"energy": 70, "hunger": 30, "social": 60},
    "emotional_state": "content",
    "identity": {"personality_traits": [...], "personal_goal": "...", "speaking_style": "..."},
    "values": ["community", "kindness"],
    "fears": ["isolation"],
    "habits": ["checks inventory"],
    "long_term_goals": ["run grocer"],
    "short_term_goals": ["greet morning customers"],
    "current_plan": null
  },
  "world": {
    "tick": 120,
    "time_of_day": "09:00",
    "known_destinations": ["grocer", "park", "square", "hospital", "station"]
  },
  "perception": {
    "visible_citizens": [{"id": "citizen-2", "name": "Dale", "distance": 240.5, "activity": "walking"}],
    "visible_places": [{"id": "grocer", "name": "Corner Grocer", "distance": 0.0}],
    "recent_events": [{"type": "citizen_moved", "tick": 118, "details": {...}}]
  },
  "private_context": {
    "memories": [{"id": 1, "text": "Had a nice chat with Dale yesterday"}],
    "relationships": {"citizen-2": {"trust": 3, "friendship": 3, "respect": 3}},
    "beliefs": {"citizen-2": "Reliable neighbor"}
  },
  "incoming": null,
  "available_actions": ["move", "talk", "wait", "rest", "eat", "work", "investigate", "follow", "avoid", "none"],
  "allowed_social_tags": ["friendly", "suspicious", "grateful", "angry", "fearful", "interested", "dismissive"]
}
```

### Response Schema

The model must respond with strict JSON matching this structure:

```json
{
  "decision": "move",
  "target_id": null,
  "destination_id": "square",
  "message": null,
  "social_tags": ["friendly"],
  "plan_summary": "Walk to Town Square to meet neighbors",
  "emotional_state": "content",
  "memory_candidate": "Decided to visit Town Square on a pleasant morning",
  "should_reconsider_at_tick": 180
}
```

### Validation and Rejection Rules

1. **Top-Level Type**: Must be a valid JSON dictionary.
2. **Decision Allowlist**: Must be one of `move`, `talk`, `wait`, `rest`, `eat`, `work`, `investigate`, `follow`, `avoid`, `none`. Unknown decisions default to `none`.
3. **Movement Rules**: If `decision == "move"`, `destination_id` must be an existing location key or anchor. Invalid destinations cancel the action to `none`.
4. **Dialogue Rules**: If `decision == "talk"`, `target_id` must be a valid citizen/player, and `message` must be a non-empty string.
5. **Social Tags Sanitization**: Max 2 tags per response. Any tags outside the allowlist are discarded. Valid tags apply bounded `±1` adjustments to relationship metrics, clamped strictly between `0` and `5`.
6. **Emotional State Validation**: Must belong to `EMOTIONAL_STATES`. Invalid values preserve the citizen's existing state.
7. **Safe Failure**: Any parsing error, timeout, or schema failure returns `{"decision": "none"}` and leaves the world simulation unmodified.

---

## LM Studio Configuration

Configuration is managed via environment variables with zero hardcoded model names:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `WILLOW_AI_MODEL` | Identifier of model loaded in LM Studio | *(none — required to enable)* |
| `WILLOW_AI_BASE_URL` | Endpoint base URL | `http://localhost:1234/v1` |
| `WILLOW_AI_TIMEOUT` | Request timeout in seconds | `8.0` |
| `WILLOW_AI_MAX_RETRIES`| Transport retry attempts | `1` |
| `WILLOW_AI_TEMPERATURE`| Sampling temperature | `0.7` |
| `WILLOW_AI_MAX_TOKENS` | Max generated tokens | `512` |
| `WILLOW_AI_MAX_CONTEXT_TOKENS` | Context budget | `4096` |
| `WILLOW_AI_COOLDOWN_TICKS` | Ticks between reasoning calls per citizen | `1` |
| `WILLOW_AI_DECISION_BUDGET` | Max reasoning calls allowed per tick | `2` |

---

## Verification & Testing

The test suite validates the reasoning layer deterministically without requiring a running LM Studio server.

### Test Matrix

| Test Module | Coverage | Status |
| :--- | :--- | :--- |
| `tests/test_ai_reasoning.py` | 17 tests: all 4 request types, prompt generation, JSON sanitization, injection defense, cooldowns, tick budgets, social tag clamping, emotional states, memory retention, fallback safety | Passing (17/17) |
| `tests/test_world.py` | Clock persistence, migrations, save atomicity | Passing (5/5) |
| `tests/test_social.py` | Core social actions, privacy, tag side effects | Passing (10/10) |
| `tests/test_daily_life.py` | Needs, routines, physical movement, day simulations | Passing (10/10) |
| `tests/test_ai_conversation.py` | Legacy Phase 4 conversation brain compatibility | Passing (12/12) |
| `tests/test_spatial.py` | Navigation, collision, A*, institutional loop | Passing (18/18) |
| `tests/test_browser_api.py` | HTTP loopback endpoints, token validation, projections | Passing (4/4) |
| **Total** | **Full project regression coverage** | **76 / 76 Passing** |

### Execution

```sh
python3 -m unittest discover -s tests -v
node --check web/app.js web/renderer.js web/physics.js
```

---

## Known Limits & Next Phase

- **Population Size**: Currently 3 authored NPCs (Cleo, Dale, Bob). Adding school pupils, hospital staff, and shopkeepers will expand the reasoning network.
- **Model Concurrency**: Running multiple local LLM inferences sequentially can introduce latency if models are large; prompt token limits and decision budgeting keep execution smooth.
- **Interiors**: Reasoning currently guides citizens between outdoor anchors and regional bounds. Future phases can incorporate building interiors and rooms.
- **Conversational Memory Summarization**: As memory lists grow over extended multi-day simulations, hierarchical summarization or vector indexing can complement the fixed recent-memory window.