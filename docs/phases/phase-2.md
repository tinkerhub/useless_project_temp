# Phase 2 — Shared Social Action

## Purpose

Create the first shared action boundary and establish private citizen knowledge.

## Completed

- `talk` action shared by future human, rule-based, and AI callers.
- Input validation and atomic mutation.
- One public event and one private recipient memory per successful talk.
- Optional deterministic social tags.
- Bounded trust, friendship, and anger values.
- Limited helpful/not-helpful beliefs based on explicit reports.
- Schema version 1 to version 2 migration.
- Private content excluded from public snapshots and events.

## Public Interface

```python
world.act("citizen-1", "talk", "citizen-2", "Meet me at the shop.")
world.citizen_context("citizen-2")
```

Supported talk tags are `neutral`, `confide`, `encourage`, `insult`, `report_help`, and `report_harm`.

## Validation

```sh
python3 -m unittest discover -s tests -v
```

## Limitations

- Citizens do not yet choose actions autonomously.
- Messages are not interpreted by AI.
- Needs, routines, commerce, movement, browser UI, and graphics are not included.

## Phase 3 Handoff

Phase 3 can use `World.act(...)` for citizen actions and `citizen_context(...)` for each citizen's private knowledge. Autonomous behavior must use the shared action boundary and must not mutate world state directly.
