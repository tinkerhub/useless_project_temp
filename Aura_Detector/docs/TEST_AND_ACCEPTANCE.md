# Test Strategy and Acceptance Plan — AUR/S

## AI Maintenance Context

**Purpose:** Defines the evidence required before claiming a slice or release works.  
**Current stage:** Server protocol and vision-adapter tests pass locally; the Android overlay, selection, aura-core, scan, and feedback slices compile. The authorized phone is connected and held `LINK: OK` through frame 130 after the CameraX transform guard; scan, landscape, and full audio/haptic acceptance remain.
**Update this file when:** a requirement changes, a defect reveals a missing case, a test fixture is added, or release evidence is measured. Do not mark a case passed without executable or manual-test evidence.

## 1. Test Principles

- Test pure behavior without a phone or GPU whenever possible.
- Use recorded/local fixture frames for server integration checks; never commit identifiable private footage.
- Test the real phone, network, and PC before calling latency work complete.
- A dropped frame is expected; a growing backlog is a failure.

## 2. Test Layers

| Layer | Coverage |
|---|---|
| Unit | Aura profile generation, finite/infinite formatting, weighted outcomes, frame ordering, state transitions, protocol validation. |
| Server integration | JPEG decode, person-only filtering, subject cap, normalized metadata schema, bad-message recovery. |
| Android integration | CameraX latest-frame policy, socket reconnect, coordinate mapping, hit-testing, stale-state visibility. |
| End-to-end | Phone → LAN → PC → overlay with real people and target hardware. |
| Demo soak | 15–30 minutes of continuous camera, rendering, tracking, and reconnect activity. |

## 3. Required Acceptance Cases

| ID | Case | Pass condition |
|---|---|---|
| AT-01 | No people visible | Preview works; no stale labels remain. |
| AT-02 | One person enters | Subject appears only after confirmation threshold. |
| AT-03 | Six people visible | No more than six fully rendered subjects; app stays responsive. |
| AT-04 | Two people cross | IDs are reasonably stable; no crash or unbounded flicker. |
| AT-05 | Tap | The touched visible subject becomes the only selected one. |
| AT-06 | Double-tap | Exactly one scan plays and returns a coherent card. |
| AT-07 | Infinity outcome | Both signs render safely with no numeric overflow or `NaN`. |
| AT-08 | Out-of-order response | Older `frame_state` cannot overwrite newer state. |
| AT-09 | Wi-Fi interruption | Preview remains; HUD shows degraded/offline; reconnect restores current data. |
| AT-10 | Invalid frame/message | Server returns recoverable error and remains available. |
| AT-11 | Portrait/landscape | Overlay and touch mapping align with preview crop/rotation. |
| AT-12 | Soak | No crash, severe thermal issue, memory growth, or latency backlog. |

Network prerequisite: run the transport test on a direct private hotspot as well as the intended demo network. A captive-portal redirect or client-isolation failure is a network setup failure, not an application response.

## 3.1 Current Verification Status

| Check | Status | Evidence needed next |
|---|---|---|
| Server protocol and vision tests | Passed | `server\\.venv\\Scripts\\python -m pytest server/tests -q` → 30 passed. |
| Android compilation | Passed | `gradle :app:assembleDebug` completed successfully after fixing project configuration and Kotlin/Compose errors. |
| Android installation | Passed | Latest debug APK, including feedback and the CameraX transform guard, installs on the authorized phone. |
| Latest-frame transport | Passed for private hotspot | Phone camera opens and reaches the PC over the Windows hotspot; it held `LINK: OK` through `FRAME: 130` after the guard. Malformed full-resolution frames are prevented by client-side downsampling. |
| Vision | Metadata loop passed; person-track acceptance pending | Phone received `LINK: OK` after the final shared-viewport/crop/rotation path and reached `FRAME: 27` with a 350 ms round trip, without a camera-process crash or CameraX viewport-mismatch warning. The earlier un-cropped smoke observation was `FRAME: 17` at 315 ms. These are not performance results. Walk one person in view and record stable ID, normalized box/contour, and inference time. |
| Overlay | Baseline built and installed; manual acceptance pending | Phone binds preview and analysis to one CameraX viewport, transmits the matching cropped/upright image, and uses a source-to-preview transform with that same rotation for the Canvas overlay. Verify a person box follows the preview in portrait, then rotate to landscape and check again. |
| Selection | Implemented; portrait tap check passed | The phone selected `#565` from a tap at `(500, 900)` and displayed `SELECTED: #565`; verify switching subjects and expiry cleanup during a walking-person run. |
| Aura core | Implemented; initial phone observation passed | Android displayed `SELECTED: #156  565 AUR/s` on the authorized phone while receiving frame 50. Verify movement stays within its band and cover the named-infinity path. |
| Scan | Implemented; physical device check pending | Double-tap the selected subject, verify the centered one-second scanning card/progress bar, then verify base, modifier, final, classification, and both named infinity paths. |
| Feedback | Implemented; control check passed | The scanner exposed `SOUND ON`; tapping it changed the visible control to `SOUND OFF` while `LINK: OK` continued through frame 130. Verify real scan tone, haptic, pulse readability, and mute behavior on the target phone. |

## 4. Performance Measurement

Log capture ID/timing, upload start, server receive, decode, inference/tracking, response send, response receive, and render. Report median and p95 for capture-to-overlay and inference/tracking.

Release target: median under 120 ms, p95 under 220 ms, and p95 server inference/tracking under 50 ms on target gear. If a target fails, document the bottleneck and use the agreed fallback configuration before adding more effects.

## 5. Release Gate

The MVP may be demoed only when all Must requirements in the PRD and AT-01 through AT-12 pass on the target phone and PC, with the actual local network configuration.
