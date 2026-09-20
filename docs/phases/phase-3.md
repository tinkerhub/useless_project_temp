# Phase 3 — Everyday Life and Motives

## Purpose

Give citizens a small deterministic daily life whose choices use the shared action boundary.

## Completed

- One tick represents one simulated hour; 24 ticks represent one day.
- Hunger and energy are bounded from 0 to 100 and advance with simulated time.
- Each citizen has home, regular-destination, sleep, and wake schedule hours.
- Visible activity is `sleeping`, `travelling`, `resting`, or `at_regular_destination`.
- `move` validates one directly connected path and commits atomically.
- Citizens deterministically choose one path step toward home or their regular destination.
- Low energy overrides the schedule until the citizen has rested.
- A citizen avoids a regular destination currently occupied by someone they maximally distrust.
- Automatic ticks omit noisy time events; meaningful movements remain public events.
- Schema versions 1 and 2 migrate to version 3 without losing private social state.

## Behavior Interface

```python
decision = World.choose_action(public_state, citizen_id, private_social)
world.act("citizen-1", "move", "street")
```

`choose_action(...)` is pure and returns either one `move` action description or `None`.
The simulation executes returned movement through `World.act(...)`; behavior code does not assign locations directly.

## Validation

```sh
python3 -m unittest discover -s tests -v
```

Tests cover the daily schedule, need bounds, movement validation, unattended advancement, low-energy priorities, persistence, migration, atomic failures, and social privacy.

## Phase 4 Handoff

- Daily-life state: needs, schedule, location, and activity persist in schema version 3.
- Behavior interface: deterministic `World.choose_action(...)` returns a shared action or no action.
- Action usage: both autonomous and external movement call `World.act(...)`.
- Limitations: hunger has no remedy, movement takes one path per hour, all starter citizens share the shop destination, and maximal-distrust avoidance is the only social behavior. There are no jobs, commerce, AI decisions, or generated dialogue.
