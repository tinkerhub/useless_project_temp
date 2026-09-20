# Phase 4 — AI Conversation and Decisions

## Purpose

Let a configured citizen produce one safe, optional response using only that citizen's knowledge.

## Completed

- Schema version 4 persists bounded personality traits, one personal goal, and a speaking style.
- `CitizenBrain.decide(request)` is the provider-independent, runtime-only AI interface. It returns `{"action": "none"}` or `{"action": "talk", "message": "...", "intent": "..."}`; report intents also require an allowed `subject_id`.
- A successful incoming `talk` may trigger the recipient's configured brain after the message is committed.
- Requests contain only the recipient's identity, current personal state, recent private memories, private beliefs and relationships, incoming message, speaker, clock, and allowed actions.
- Provider output must be an exact `none` or validated `talk` structure. Valid replies execute through `World.act(...)` and use the existing memory, relationship, persistence, and public-event rules.
- Provider errors, malformed output, timeout, stale cooldown races, and reply-save failures safely become no reply without undoing the incoming message.
- AI replies never trigger another brain. A persisted per-pair, simulation-tick cooldown also limits replies.
- Public snapshots omit both private social state and private AI cooldown metadata.

## Configuration

Pass runtime provider objects to `World(..., ai_brains={citizen_id: provider})`. A provider implements `decide(request)`. Optional timeout and cooldown constructor arguments are runtime settings. Credentials, model selection, provider objects, and prompts are never part of saved state or repository configuration.

## Validation

```sh
python3 -m unittest discover -s tests -v
```

Tests use only deterministic fake providers and cover successful replies, no-provider behavior, exact privacy scope, detached context, output validation, provider failure, timeout, atomic reply failure, response limits, non-recursion, cooldown persistence, identity migration, configuration persistence boundaries, and all earlier world behavior.

## Phase 5 Handoff

- **AI interface:** `CitizenBrain.decide(request)` returns untrusted structured data.
- **Trigger rule:** one committed incoming `talk` can cause at most one immediate reply from its configured recipient; generated replies do not trigger AI.
- **Configuration:** brains, credentials, models, timeouts, and provider prompts are runtime-only.
- **Privacy:** no global snapshot or other citizen's private memories, beliefs, or relationships enter a request; no prompt or generated private message enters public events.
- **Tests:** the fake-provider suite exercises the complete success and fallback boundary without network access.
- **Limitations:** no real provider adapter, streaming, autonomous planning, AI-to-AI chains, durable prompts, chain-of-thought storage, or conversation history beyond existing private memories. Timeout stops waiting but cannot forcibly terminate provider code already running in its isolated daemon thread.
