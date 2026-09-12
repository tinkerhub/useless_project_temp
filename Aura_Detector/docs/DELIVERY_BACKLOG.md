# Delivery Backlog — AUR/S

## AI Maintenance Context

**Purpose:** Tells the AI the next permitted implementation step and the evidence that closes it.  
**Current stage:** Build Guide Step 8 feedback implementation is build- and install-verified. Physical scan, audio/haptic, landscape, and performance acceptance remain.
**Update this file when:** starting a slice, completing its definition of done, splitting a proven-too-large slice, or adding a user-approved scope item. Preserve completed slices as history.

Build each slice to its acceptance condition before starting the next one. This is an ordered backlog, not a promise of calendar dates.

| Slice | Outcome | Requirement links | Done when |
|---|---|---|---|
| 0. Environment | Phone and PC can talk on the private LAN. | NFR-06 | Source exists; manually verify health endpoint opens from phone and Android shell installs. |
| 1. Transport | Latest JPEG/ack loop with frame ordering. | FR-02, FR-03 | Debug APK installs and camera reaches the PC over the private hotspot; frame IDs and latency are visible while vision runs. |
| 2. Vision | PC returns up to six person track boxes and simplified contours. | FR-04, FR-11 | Automated decode/filter/normalization tests pass; phone receives live frame states; walking subject gets a temporary ID; malformed input recovers. |
| 3. Overlay | Phone draws aligned labels/boxes and status. | FR-01, FR-02 | Portrait tracking and overlay were confirmed on the physical phone; landscape acceptance remains. |
| 4. Selection | One tapped subject is active. | FR-06, FR-07 | Implemented with contour/box hit-testing, single-selection highlighting, HUD state, and expiry cleanup; a physical tap selected `#565`. |
| 5. Aura core | Stable profiles and live random walk. | FR-05, FR-07 | Implemented: Android parses the stable server profile and updates one selected track locally within its finite band (or displays named infinity). A live selected reading was observed on the authorized phone; range/infinity coverage remains. |
| 6. Scan | Double-tap creates a safe result card. | FR-08, FR-09 | Implemented locally: selected-subject double-tap runs a 1-second state machine, then shows finite, milestone, or named infinity base/modifier/final/classification text. Physical acceptance remains pending. |
| 7. Feedback | Readable effects, muteable sound, haptics. | FR-10, FR-13, NFR-07 | Implemented: the scan card pulses when system animations are enabled; scan start/completion request short system haptics and optional tone cues; a visible session mute toggle works. Verify sound/haptics and readability with a real scan and six subjects. |
| 8. Performance | Measured target configuration and fallback. | NFR-01..05 | Target PC/phone network pass p95 release gate. |
| 9. Post-MVP | Cooldown-safe interference. | FR-15 | Cannot retrigger continuously or disrupt core flow. |

## Definition of Ready

Start a slice only when its predecessor is demonstrably working, its requirements are unambiguous, its test condition is written, and any dependent hardware/network is available.

## Definition of Done

A slice is done when its linked requirements pass their acceptance tests, errors fail visibly and safely, documentation reflects final behavior, and the result works on the physical phone/PC where applicable.
