# Product Requirements Document — AUR/S

**Status:** Draft v0.1  
**Product:** AUR/S — Human Aura Radiation Monitor  
**Release:** Local-network Android demo MVP

## AI Maintenance Context

**Purpose:** Defines what must be built and what must remain out of scope.  
**Current stage:** Stage 8 — transport, server-side person segmentation, aligned Android overlays, tap selection, local aura-core/scan logic, and feedback have implementation evidence; physical scan/audio/haptic acceptance and performance measurement remain.
**Update this file when:** the user changes user-facing behavior, priorities, scope, success criteria, or a requirement's acceptance meaning. Do not update it merely because code structure changes.

## 1. Product Summary

AUR/S is a playful Android camera experience. It detects temporary person tracks through a local PC vision server, then overlays deliberately fictional aura readings and scan effects on the phone's live camera preview.

Vision locates people only. Aura results are generated entertainment, never a measurement or inference about a person.

## 2. Goals and Non-Goals

### Goals

- Make a small crowd immediately look like a ridiculous sci-fi scanning experience.
- Keep overlays current enough to feel attached to people on screen.
- Make selection and scan interactions obvious, fast, and satisfying.
- Run entirely on one phone and one PC on a private local network.
- Produce a safe, demonstrable project for TinkerHub Useless Projects.

### Non-Goals

- Measure health, personality, spirituality, emotion, or any real human attribute.
- Recognize faces, retain identity, or store video.
- Support internet deployment, multiple phones, iOS, custom model training, or permanent accounts.
- Guarantee identity continuity after a person leaves the camera view.

## 3. Users and Primary Scenario

**Primary user:** a participant demonstrating the project to friends or judges in a shared space.

**Primary scenario:** The user opens the app, connects to the local PC, points at a group, sees temporary subjects and colourful fields, taps one subject, then double-taps for a theatrical aura result.

## 4. Functional Requirements

| ID | Priority | Requirement |
|---|---|---|
| FR-01 | Must | Show the phone's local live camera preview. |
| FR-02 | Must | Connect to one configured local PC server and show `OK`, `DEGRADED`, or `OFFLINE`. |
| FR-03 | Must | Send only current camera frames and ignore stale tracking responses. |
| FR-04 | Must | Show up to six temporary tracked subjects with IDs and aura fields. |
| FR-05 | Must | Give a newly confirmed subject a stable profile for the lifetime of that track. |
| FR-06 | Must | Let the user select at most one currently visible subject with a tap. |
| FR-07 | Must | Show a non-negative, fluctuating live `AUR/s` value only for the selected subject. |
| FR-08 | Must | Start a scan on double-tap of the selected subject and show a signed base, modifier, and final result. |
| FR-09 | Must | Support finite values, milestones, `+∞`, and `-∞` without invalid arithmetic or display errors. |
| FR-10 | Must | Trigger a readable local visual effect and optional sound/haptic response for a completed scan. |
| FR-11 | Must | Clear selection and fade its overlay when a selected track expires. |
| FR-12 | Must | Never record frames or identify people. |
| FR-13 | Should | Allow sound to be muted from the HUD. |
| FR-14 | Should | Reconnect automatically after a local connection interruption. |
| FR-15 | Could | Trigger cooldown-protected aura interference between nearby subjects. |

## 5. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | Median capture-to-overlay latency is under 120 ms on the target network; p95 is under 220 ms. |
| NFR-02 | p95 inference plus tracking is under 50 ms on the target RTX 4060 profile. |
| NFR-03 | The app remains usable with six active subjects. |
| NFR-04 | The phone renders its own camera preview even when the server is unavailable. |
| NFR-05 | Stale server data is visibly marked degraded and is not presented as live. |
| NFR-06 | All transfers stay on the local network and require a per-session token. |
| NFR-07 | Subject labels, selection state, and scan result remain readable over all effects. |

## 6. Product Rules

- A server track ID is a temporary visual label, not an identity.
- Aura profiles are deterministic from a hidden session seed and track ID until that track expires.
- The phone owns live-number animation, selection, scans, effects, sound, and haptics.
- The PC owns image decoding, detection, tracking, and profile assignment.
- Infinity is a display state; normal numeric modifier arithmetic never changes an infinite final result.

## 7. Success Criteria

The MVP succeeds when a new user can connect, scan a visible person, understand that the reading is a joke, and see an overlay that feels current without a developer explaining the architecture.

## 8. Release Scope

**In MVP:** local connection, person detection/tracking, IDs, boxes/contours, seeded profiles, selection, live reading, finite/infinite scans, core effects, reconnect status, and metrics.

**After MVP:** interference, ReID tuning, high-fidelity contour effects, TensorRT tuning after baseline measurement, share cards, and alternate unit labels.
