# Phase 5 — Playable Town, Movement, and First Institutional Loop

## Delivered

- An authored 12,288 × 9,216 town: 41 building exteriors, seven districts, public squares, parks, gardens, school grounds, a college, library, hospital, police station, shops, housing, and a station.
- Three existing NPCs plus one persisted human actor. More map area does not create more citizens.
- Direct WASD/arrow movement on all open ground, including grass. Touch controls appear on small/coarse-pointer screens. Very short taps are retained for one physical update.
- Footprint collision shared by player and NPCs; bounded substeps prevent tunnelling, and walls permit sliding. Buildings, tree trunks, benches, fountain, pond, and town bounds are solid. Streets and paths do not constrain movement.
- Smooth following camera, adjustable zoom, directional walking sprites, depth ordering, distinct entrance markers, minimap, and an optional town map with destination markers.
- Citizens follow continuous A* routes, with clearance, checked route segments, and no diagonal corner cutting. Arrival spots keep citizens individually readable.
- Proximity and line-of-sight conversations use the original `World.act(..., "talk", ...)` action. Conversation participants wait while others continue. Escape releases the conversation; abandoned sessions expire.
- Browser dialogue is a projection of only the player's exchange with the selected citizen. AI configuration remains runtime-only; absent providers never produce replies.

## First institutional loop

Cleo has one persisted fall outside Corner Grocer after reaching the area. Nearby citizens can observe it. A nearby player can offer help with F; otherwise a nearby NPC can offer help through the same action boundary at a routine decision.

Assistance starts a real journey to the hospital, creates scoped observations, and modestly improves Cleo's private trust/friendship toward the helper. The hospital provides care after arrival. The trip interrupts Cleo's planned morning. A witness may file their account at the police entrance; an NPC helper can travel there and report autonomously. A report never declares a crime or assigns guilt. No dialogue is fabricated by this loop.

Hospital care and witnessed reports are functioning abstractions. Schools, college, library, other workplaces, and additional shops currently provide explorable grounds and spatial anchors; classes, staffing, jobs, borrowing, shopping, and indoor services are not implemented. The UI describes these limits at entrances and in the map directory.

## Architecture

- `town.py`: stable authored map, place regions/anchors, collision geometry, spatial index, and A* navigation.
- `spatial.py`: physical stepping, validated movement/interaction actions, browser projections, transcript filtering, and the initial incident loop.
- `world.py`: existing authoritative simulation, schedules, social actions, private context, AI boundary, migration, and atomic persistence.
- `server.py`: standard-library loopback HTTP server and a simulation loop independent of browser connections.
- `web/physics.js`: client prediction using the same geometry and algorithm, covered by cross-language fixtures.
- `web/renderer.js`: Canvas 2D terrain, scenery, sprites, camera, and map rendering.
- `web/app.js`, `web/style.css`, `index.html`: controls, snapshots, interpolation/reconciliation, focused overlays, and responsive layout.

The physical server step is 50 ms (20 Hz), browser snapshots poll around 10 Hz, and rendering uses animation frames. NPCs interpolate between snapshots. The player predicts movement locally and reconciles against server positions. The server accepts direction/sequence only; it chooses elapsed time and speed. Expired inputs stop after 450 ms. Blur, hidden tabs, and overlays release movement. Reconnection refreshes the session token.

One game hour defaults to 30 real seconds. `--tick-seconds` changes the game clock, not walking speed. New saves open at 08:00; existing saves retain their clock. `World.advance(hours)` is explicit clock advancement and destination selection; `World.step(dt)` advances physical travel. No elapsed downtime is added at restart.

Named places have outdoor regions and entrance/meeting anchors. Coordinates determine current place; destination is separate from current location. Existing home/shop IDs continue to drive routines. Legacy graph records remain in saves for compatibility, but no movement uses them.

Shared action examples:

```python
world.act("player", "steer", params={"dx": 1, "dy": 0, "sequence": 1})
world.act("citizen-1", "move", "hospital")
world.act("citizen-1", "move", params={"x": 5400, "y": 4800})
world.act("player", "engage", "citizen-1")
world.act("player", "talk", "citizen-1", "Hello.")
world.act("player", "disengage")
world.act("player", "assist", "citizen-3")
world.act("player", "report", "police")
```

`move` queues a journey and never changes position immediately. It emits `journey_started`; reaching the goal emits `journey_arrived`. The old connected-path movement assertions were replaced with physical journey assertions.

## Persistence and privacy

Schemas 1–4 migrate to schema 5 with spatial positions and valid anchors, preserving IDs, resources, clock, private social state, existing identities, and AI cooldowns. Current saves retain positions, in-progress routes, and incident progress. Invalid geometry/routes fail validation rather than reseeding.

Social actions, journey commands, and incident transitions persist atomically before publication. Movement checkpoints every second and flushes on input stop and normal shutdown. An abrupt process or machine failure can lose up to approximately one second of movement; it does not discard already committed social actions. Transient input and conversation holds are never restored.

HTTP only serves an explicit static-file allowlist. Browser state explicitly selects public fields. Transcript reads are bound to the local player; no private citizen-context endpoint exists. Requests cannot choose another actor, set coordinates directly, access the save, or change the clock. Mutation requests require a same-origin token. This is a local, single-player application, not a multi-account security model.

Private observations are scoped to their owner and included only in that citizen's AI context. The player receives their own observations; citizen thoughts, beliefs, relationship values, goals, and cooldowns are excluded from browser data.

## Validation

```sh
python3 -m unittest discover -s tests -v
node --check web/app.js
node --check web/renderer.js
node --check web/physics.js
```

The suite includes actual loopback HTTP tests, so a sandbox must allow local socket binding. Coverage includes earlier social/AI behavior, migrations, atomic failures, normalized speed, off-street movement, walls and corners, route validity, player/NPC collision, stale/expired inputs, clock independence, conversations, transcript privacy, restart recovery, client/server collision parity, and help/care/report consequences.

Browser checks exercise keyboard movement, arrow keys, camera following, wall blocking, E interaction, sending a real talk action with no configured provider, Escape back to movement, town-map navigation, viewport changes, and persistence/reconnection. Test towns use separate save files; the project save is backed up before migration.

## Known limits / next phase

- Only three NPCs. Staffing, students, and households need a separate population expansion.
- One finite incident is implemented; there is no general health, crime, investigation, education, employment, or economy simulation.
- No interiors. Home rest and hospital care occur at outdoor anchors.
- People can pass through one another; solid environmental obstacles block everyone.
- Ground outside defined place regions currently maps to the legacy street place, while the UI independently identifies districts.
- No new real AI-provider adapter, offline time catch-up, multiplayer, combat, infinite terrain, or procedural world generation.
- Movement persistence is checkpointed; unexpected crashes have the recovery window described above.
