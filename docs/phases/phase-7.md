# Phase 7 — 50-Citizen Town, Bounded AI Scheduler, and Institutional Consequences

## Delivered

- **50 Distinct Citizens + Human Player**: Expanded population from 3 to 50 persistent NPC citizens across seven districts. Completely preserves Ada, Ben, and Cleo, their established histories, homes, and relationships without duplication.
- **Authored Population Catalog (`population.py`)**: 47 new citizens with authored biographies, occupations, homes, daily schedules, evening commitments, walking speeds (120–175 world units/s), and sparse social networks (family, coworker, neighbor, and tension links).
- **Safe & Idempotent Migration**: Schema upgraded to version 6 (`population_version = 1`). Existing saves migrate idempotently; repeated loading never creates duplicate residents.
- **Asynchronous AI Scheduler (`citizen_scheduler.py`)**: Dedicated single inference worker running outside the authoritative simulation lock. Bounded pending queue (capacity 50), one outstanding job per citizen, dialogue prioritized, and aging ensures fair access across the roster. Slow or delayed model calls never interrupt movement physics or clock progression.
- **Server-Side Revalidation**: Results arriving from the scheduler are revalidated against the citizen's current situation (plan generation, proximity, active conversation session). Stale or superseded plans are dropped cleanly without state corruption.
- **Bonsai Optimization & Usable Capacity**: Evaluated LM Studio with `prism-ml/bonsai-27b`. Default reasoning requests took 39–60 seconds; enabled native reasoning-off mode (`reasoning="off"`), reducing time-to-first-token to ~14s and total response time to 19.08s with zero reasoning tokens, producing in-character dialogue that passes strict schema validation.
- **Continuous Daily Life & Commitments**: Replaced rigid single-destination routines with time-windowed commitments (`work`, `study`, `leisure`, `resting`). Physical travel times are estimated before departure; citizens set out early so they arrive on time. Continuous clearance navigation (`clear_segment`) prevents route clearance stalls at varied walking paces.
- **Presence-Based Institutions (`institutions.py`)**: Real consequences tied to physical staff presence across 12 town institutions:
  - **Hospital**: Injured citizens receive care and recover only when medical staff are physically present at the hospital.
  - **Police Station**: Witnessed incident reports are reviewed on record when police officers are on duty.
  - **Daily Attendance Ledger**: Automatically records `arrived` and `missed` commitments per citizen per day.
  - **Dynamic Operating Hours**: Venues update availability based on both clock hours and on-site staffing.
- **Enhanced Browser Experience**:
  - Direct WASD/arrow walking across all 12,288 × 9,216 open ground.
  - Town Map destination compass tracking 23 landmarks across all districts.
  - Building entrance inspection dialog with live service badges showing operating hours, open/closed status, and on-duty staff counts.
  - Conversation modal with real-time pending reply indicators ("considering a reply…") allowing the player to freely walk away at any time.
- **Comprehensive Test Suite (88 Passing Tests)**: All unit, spatial, social, daily life, AI reasoning, LM Studio transport, population scheduler, and loopback HTTP tests pass 100%.

---

## Architecture

```
                                    Authoritative Simulation (20 Hz)
                                  +----------------------------------+
                                  |    World Step & Physical Motion  |
                                  |    (world.py, spatial.py)        |
                                  +-----------------+----------------+
                                                    |
                         +--------------------------+--------------------------+
                         |                                                     |
                         v                                                     v
          +-----------------------------+                       +-----------------------------+
          |  Presence-Based Institutions|                       |  CitizenScheduler           |
          |  (institutions.py)          |                       |  (citizen_scheduler.py)     |
          |                             |                       |                             |
          |  - 12 Service registries    |                       |  - Bounded queue (max 50)   |
          |  - Staff attendance ledger  |                       |  - Player dialogue priority |
          |  - Hospital care & recovery |                       |  - Aging & starvation guard |
          |  - Police report review     |                       |  - Stale result drop        |
          +-----------------------------+                       +--------------+--------------+
                                                                               |
                                                                               v
                                                                +-----------------------------+
                                                                | Background Worker Thread    |
                                                                | (Runs outside world lock)   |
                                                                +--------------+--------------+
                                                                               |
                                                                               v
                                                                +-----------------------------+
                                                                | LM Studio / Bonsai API      |
                                                                | (lm_studio.py)              |
                                                                | - reasoning="off" mode      |
                                                                | - Strict JSON validation    |
                                                                +-----------------------------+
```

---

## Performance & Usable Capacity

1. **Simulation Update Budget (20 Hz / 50 ms budget)**:
   - Median 50-citizen step: **1.13 ms**
   - 95th-percentile step: **6.17 ms**
   - Headroom: **>87%** of frame budget available under continuous multi-actor pathfinding.

2. **Inference Latency & Response Quality (Bonsai 27B)**:
   - Full reasoning mode: **39.12s – 60.01s** (high latency due to verbose chain-of-thought).
   - Native reasoning-off mode (`reasoning="off"`): **19.08s** total response time (14.13s time-to-first-token, 52 output tokens at 10.7 tok/s, 0 reasoning tokens).
   - Validation rate: 100% valid schema extraction with zero hallucinations or corruptions.

---

## Verification & Regressions

Run full test suite:
```sh
python3 -m pytest
```

Output:
```
============================= 88 passed in 13.75s ==============================
```

Browser asset validation:
```sh
node --check web/app.js web/renderer.js web/physics.js
```
