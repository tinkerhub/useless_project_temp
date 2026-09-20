# Willow: 50-citizen implementation plan

Status: proposed implementation sequence. Planning only; this document does not enable AI or change saved citizens.

## Outcome

A spacious, persistent town with **50 NPC citizens plus the player**. Every citizen has a distinct identity, personal knowledge, relationships, needs, commitments, and walking pace. Citizens continue living while Bonsai considers decisions. The player can explore, encounter someone, converse privately, and resume walking without pauses in the world.

Keep the Python simulation authoritative, the existing Canvas renderer, the authored 12,288 × 9,216 map, and LM Studio's `prism-ml/bonsai-27b`. Finish the systems before the final visual pass. Preserve Ada, Ben, Cleo, their history, and the player's progress.

## What the current implementation establishes

- Coordinate movement, obstacle collision, routes, following camera, proximity conversations, and spatial persistence already exist.
- LM Studio exposes Bonsai and accepted a real structured citizen decision after the adapter changed to JSON schema output. That single request took 39.12 seconds; this is a measurement, not an established average.
- Hourly AI calls currently wait inside the world lock. The gateway's default timeout is one second. Raising it alone would worsen stalls.
- AI execution currently mutates some plans, needs, memories, and relationships outside an atomic action transaction. The accepted action vocabulary exceeds the depth of implemented behavior.
- Population is three NPCs with a shared simple schedule structure. Existing documentation overstates some completed behavior and must be corrected as milestones land.

## Architecture decisions

1. **Three independent rates.** Render at display speed, move authoritative actors at a fixed 20 Hz, and advance a configurable simulation clock. AI requests use wall-clock deadlines and bounded capacity; commitments use simulation time. Changing rendering speed must never change a citizen's life.
2. **Separate minds, shared inference.** Each citizen owns persistent state and receives an isolated context. One shared Bonsai service evaluates those contexts. No shared conversation transcript or cross-citizen private memory is sent to the model.
3. **Continuous activity between decisions.** Authored schedules and validated plans execute without another model call for each step. Bonsai chooses intentions and dialogue; the server handles navigation, eligibility, durations, resources, and effects.
4. **One mutation boundary.** All accepted decisions become validated actions whose public events and private effects commit together. Failed validation or saving applies nothing. Model output cannot directly edit state.
5. **No inference on the simulation thread.** Capture bounded context under a short lock, release it, perform inference in a bounded worker, then enqueue the result for server-side validation. Never wait for a model while holding the world lock.
6. **Explicit uncertainty.** A proposed reflection is subjective, not evidence that an event occurred. Factual memories come from simulation events or attributed conversations. No fabricated fallback replies.

## Milestone 1 — Establish the baseline and repair action commits

Work:

- Run the current full suite and record failures before modifications. Back up the real save and add representative migration fixtures.
- Audit the complete AI action allowlist. Implement real preconditions and effects for move, talk, wait, rest, eat, work, assist, and report. Expose investigate, follow, or avoid only where their actual behavior is supported and tested.
- Commit plans, emotional changes, memories, and relationship effects atomically with actions. A citizen's interpretation changes that citizen's relationship view; another person's feelings do not change automatically in both directions.
- Prevent recursive NPC reply chains. One conversation turn creates at most one scheduled response; further turns require explicit scheduling and a conversation budget.
- Add developer-only timing and queue counters without exposing private content through browser endpoints.

Completion check: invalid actions, duplicate results, and injected save failures leave positions and social state unchanged. Existing behavior remains covered; tests are changed only where the intended behavior changes.

## Milestone 2 — Make Bonsai asynchronous and measure usable capacity

Work:

- Build a shared scheduler with a bounded pending queue, one outstanding request per citizen, deduplication, expiry, and bounded result storage. Start with one actual inference in flight; increase only if measured throughput and latency improve.
- Prioritize player dialogue, then urgent witnessed events, then ordinary reconsideration. Add aging and round-robin selection so citizens later in the roster are never permanently excluded.
- Coalesce repeated background triggers into the newest useful request. Queue overflow drops obsolete background work rather than growing memory indefinitely.
- Tag requests with citizen ID, request ID, plan generation, trigger, context time, and conversation ID when applicable. Revalidate relevant preconditions when the result arrives. Reject superseded plans and invalid conversation responses without rejecting every result merely because the global tick changed.
- Treat an expired model request as still consuming worker capacity until transport completion or confirmed cancellation. Do not replace timed-out threads indefinitely.
- Align transport timeout, scheduler deadline, retries, and configuration validation. Use bounded backoff for unavailable inference; authored routines continue.
- Measure warm/cold dialogue and planning latency, valid-output rate, token consumption, queue delay, and deadline expiry. Compare bounded prompt/output sizes and supported thinking settings on the installed model. Do not change model silently.
- Set the final simulation time scale and decision frequency from these measurements and actual route durations. A 39-second response must not routinely arrive after the commitment it was meant to influence.

Completion check: a fake provider delayed for 60 seconds does not interrupt movement, state polling, saving, or the clock. Outstanding work remains bounded under a flood of triggers. Every eligible citizen receives service under a finite workload. Live Bonsai produces both a valid plan and a relevant reply through the scheduler.

Performance gate: target ordinary warm player replies within 10 seconds on this machine. Report measured median and slow-tail latency; if this target cannot be met with Bonsai, document the limitation and settle the model/settings tradeoff before declaring the experience finished. Streaming an incomplete JSON object does not count as a usable reply.

## Milestone 3 — Expand safely to 50 distinct citizens

Work:

- Create a versioned, authored population catalog with stable IDs. Retain the original three identities and histories; add exactly 47 NPCs. Keep the human player outside the population count and AI assignment.
- Suggested roster: 6 healthcare staff, 4 police/public-service staff, 4 school staff, 5 college staff, 8 adult college students, 10 retail/hospitality workers, 5 transport/maintenance workers, and 8 residents with flexible routines. Total: 50. Assign existing citizens without overwriting their established identities.
- Give each person an authored biography, occupation, household, personality, values, preferences, speaking style, personal goal, walking speed, and schedule. Build meaningful differences rather than random adjective combinations.
- Seed a sparse network of family, friendship, coworker, and tension connections with clear provenance. Do not initialize everyone as acquainted or generate thousands of arbitrary relationship scores.
- Assign homes and workplaces to actual map anchors, sharing households where appropriate. Validate routes and enough distinct arrival slots at busy sites.
- Migrate existing saves idempotently with a new schema version and population catalog version. Add missing citizens once; preserve existing state. Define deterministic behavior for unsupported newer saves and interrupted writes.

Completion check: new and migrated worlds contain exactly 50 NPCs plus the player. Repeated loading adds no duplicates. Every NPC has a valid home, identity, reachable destinations, and persistent individual pace. The town shows varied people across its districts.

## Milestone 4 — Make daily life varied and physically believable

Work:

- Replace the one-destination schedule with commitments containing time windows, place, activity, duration, and priority. Support work shifts, classes, meals, breaks, visits, leisure, and sleep using one common system.
- Estimate travel time before departure. Long journeys, delays, and missed appointments become explicit events. Avoid synchronizing all 50 departures or planning checks on the same hour.
- Add a bounded plan executor: travel, arrive, perform an eligible activity, finish, and reconsider. Higher-priority needs or witnessed emergencies can interrupt a plan; conversation pauses only its participants.
- Keep individual speeds within a readable range around the current NPC scale, initially approximately 120–175 world units/second. Tune against the town's route lengths and time scale.
- Cache static navigation data, spread route work across updates, and profile before introducing more complex optimization. Add arrival slots and lightweight yielding at busy entrances so citizens do not stack or deadlock. Preserve identical solid-obstacle rules for player and NPCs.

Completion check: a full simulated day shows different departures, routes, breaks, activities, and returns. Citizens cannot eat without a valid food source or work by merely setting a label. Slow inference does not strand people or repeatedly erase their schedules.

## Milestone 5 — Strengthen personal knowledge, memory, and conversations

Work:

- Build bounded context from the citizen's identity, current commitment, needs, relevant relationships, recent experiences, and directly perceived surroundings. Include explicit knowledge limits and known public place information.
- Separate witnessed facts, attributed hearsay, subjective beliefs, and private reflections. Preserve source/event IDs and time. New information can correct a belief without rewriting the original event.
- Retrieve relevant memories by participant, event, place, and recency before considering a vector database. Bound prompt size and long-term storage; do not rely on unbounded transcripts.
- Give citizens reasons to initiate limited nearby conversations, with per-pair cooldowns and global inference budgets. Model replies remain subject to range and conversation-state validation.
- Make player talk submission return promptly with a pending conversation turn. Display the accepted reply when ready, support leaving while waiting, and define that leaving ends the live exchange; late replies are not silently delivered as nearby speech.
- Keep private thoughts, goals, relationship values, and model diagnostics out of public actor data. The browser receives only the player's own conversation with the chosen citizen.

Completion check: two citizens questioned about the same incident answer from their different supplied knowledge. An uninformed citizen is allowed to say they do not know. Automated tests prove context isolation and private API projections; live checks assess answer grounding without claiming a model can never hallucinate.

## Milestone 6 — Give institutions bounded, connected consequences

Work:

- Add a shared institution model: place, opening hours, assigned staff, eligible participants, capacity, appointments/queues, and persistent service state.
- Hospital: assistance, a visit queue, available staff, care duration, and recovery that affects commitments. Keep health abstract.
- Police station: attributed reports, staff review, and follow-up tasks. A report remains an allegation until supported by simulated evidence; it does not automatically establish guilt.
- College and school: staff shifts, lessons, attendance, and missed commitments. The initial roster uses adult college students; school pupils are outside this 50-person scope unless explicitly added later.
- Shops/cafes: existing food resources, opening/staff availability, breaks, and social meeting opportunities. Avoid expanding into a complex economy.
- Public spaces: parks, library, community center, and plazas serve as scheduled meeting and leisure destinations.
- Introduce a small set of repeatable event types with causes, witnesses, participants, consequences, and resolution. Replace the single hard-coded incident with this framework while migrating any incident in progress.

Completion check: demonstrate three complete causal chains—an injury changes care and attendance; a witnessed disagreement produces differing memories and a report; a missed shift changes service availability and prompts a coworker response. AI dialogue may vary; the underlying events and consequences are real server state.

## Milestone 7 — Validate the complete 50-person simulation

Work:

- Run deterministic multi-day tests with scripted providers, accelerated clock tests, and a real-time soak with slow and unavailable inference. Exercise restart during travel, pending dialogue, care, and institutional queues.
- Confirm atomic persistence of population, positions, commitments, relationships, memories, plans, and event state. Pending network requests are not resumed blindly after restart; reconsider their triggers from saved state.
- Profile physics, route requests, save size/time, API response latency, and rendering preparation with all 50 active. Keep 20 Hz authoritative updates; target the 95th-percentile simulation step below its 50 ms budget on the user's machine.
- Confirm total pending jobs and worker count plateau under sustained load. Keep only bounded timing diagnostics and aggregated counters.
- Repeat privacy, collision, action validation, migration, and provider-failure regression checks. Document actual commands and results; do not claim browser or live-model success from mocked tests.

Completion check: all required tests pass; no growing request backlog, runaway threads, unexplained teleports, duplicate citizens, private-data exposure, or unrecoverable save state. Record remaining performance limits explicitly.

## Milestone 8 — Perfect the world using the finished population

Work:

- Retain the spacious map. Tune districts and destinations using observed walking times and gathering patterns, rather than shrinking the world to make it look busy.
- Give hospital, police station, college, school, and major public spaces distinct silhouettes, signage, entrance treatment, and consistent scale.
- Add readable sprite variations, directional movement, restrained activity cues, and label rules that stay usable when people gather.
- Refine paths, trees, street furniture, meeting spots, lighting/color, and camera behavior. Preserve walkability outside roads and visual agreement with collision geometry.
- Keep world overlays compact. Finish pending/reply/error states, keyboard focus, Escape behavior, and walking after conversation.
- Verify the actual browser with WASD, arrows, diagonals, off-road walking, wall sliding, map edges, camera following, busy entrances, conversation departure/reentry, refresh, disconnect/reconnect, and representative desktop/mobile widths.

Completion check: target smooth 60 FPS on the user's desktop with 50 citizens and no visible AI-related movement stalls. Camera, controls, entrances, and conversations remain readable and responsive in direct browser testing.

## Scope boundaries and delivery discipline

- This is a complete bounded town simulation, not every real-world system. No interiors, infinite terrain, combat, multiplayer accounts, complex economy, or new provider integration beyond the existing LM Studio adapter.
- Each milestone ends with a working visible or testable result, a short handoff, and known limitations. Complete foundations before increasing system complexity.
- Update README and phase handoffs to match verified behavior. Keep a single final checklist with evidence, rather than marking broad aspirations as delivered.
- Final delivery includes the persistent 50-citizen town, a verified startup command/configuration, passing regressions, live Bonsai results, a browser walkthrough, backup/migration instructions, and measured performance limitations.

The first implementation slice is Milestones 1 and 2. Population expansion follows only after slow inference can no longer stall the simulation.
