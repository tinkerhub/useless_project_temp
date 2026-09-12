# Aura Detector Internal Documentation

**Audience:** AI agents and project implementers. This folder is not public-facing project copy.  
**Current project stage:** Build Guide Step 8 — the Android subject overlay, tap selection, local live reading/scan, and feedback implementation compile and install; physical scan/audio/haptic and performance acceptance are next.
**What has been done:** planning documents, Android settings shell, server health/protocol scaffold, latest-frame camera/WebSocket transport, a working camera preview, live YOLO person tracking, aligned subject overlays, phone-validated tap selection, a bounded local aura random walk, a local scan state machine, and local pulse/tone/haptic feedback now exist.
**What happens next:** run the manual scan acceptance on the authorized phone—confirm the selected `AUR/s`, centered scan card, pulse, audio/haptics, and mute control—then measure the final target configuration while keeping the private hotspot as the known-good network fallback.

This folder is the source of truth before implementation begins. All documents describe the **MVP** unless a section explicitly says post-MVP.

| Document | What it tells the AI / when to update it |
|---|---|
| [PRD.md](PRD.md) | Required behavior and scope; update when the user changes a product requirement or priority. |
| [TRD.md](TRD.md) | System shape and technical constraints; update when implementation changes architecture, state, dependencies, or configuration. |
| [WEBSOCKET_PROTOCOL.md](WEBSOCKET_PROTOCOL.md) | Exact phone/PC contract; update before changing any message or protocol behavior. |
| [UX_SPEC.md](UX_SPEC.md) | Interaction and visual-state contract; update before changing gestures, feedback, or failure presentation. |
| [TEST_AND_ACCEPTANCE.md](TEST_AND_ACCEPTANCE.md) | What proves work is correct; update when a requirement gains or changes an acceptance condition. |
| [SECURITY_PRIVACY_OPERATIONS.md](SECURITY_PRIVACY_OPERATIONS.md) | Data boundaries, safe operation, and demo recovery; update when data, network exposure, or operations change. |
| [DELIVERY_BACKLOG.md](DELIVERY_BACKLOG.md) | The next smallest useful slice; mark a slice complete only after its stated evidence exists. |
| [DECISIONS.md](DECISIONS.md) | Why significant choices were made; append an ADR when a decision is accepted, rejected, or reversed. |

Related project material:

- [Product concept and event documentation](../USELESS_PROJECTS_DOCUMENTATION.md)
- [Detailed product plan](../aura-radiation-monitor-plan.md)
- [Practical build guide](../AURA_DETECTOR_BUILD_GUIDE.md)

## Document Rules

- Update the relevant source document in the same change as any decision or behavior change.
- Requirements use IDs (`FR-*`, `NFR-*`) so tests and backlog items can point to them.
- A statement marked **decision pending** must be resolved before implementation depends on it.
- Do not document features that have not been approved as scope.

## Stage Ledger

| Stage | Status | Evidence / documentation to update |
|---|---|---|
| 0. Planning | Complete | Product, architecture, protocol, UX, test, operations, backlog, and decisions are documented. |
| 1. Environment / structure | Source exists; manual verification pending | Android settings shell and Python server scaffold exist. Record actual SDK, Python/CUDA, device, and LAN setup in TRD and operations. |
| 2. Transport | Physically validated on private hotspot | Camera latest-frame JPEG sender, v1 hello/ack, token entry, frame ordering, status HUD, successful install, and camera preview are verified. |
| 3. Vision and overlay | Live portrait tracking and overlay confirmed; landscape acceptance remains | `yolo26n-seg.pt` loads once, warms up, decodes JPEGs, filters COCO person, tracks with BoT-SORT, caps six subjects, and emits normalized boxes/contours. Android binds preview/analysis to one CameraX viewport, transmits the matching cropped and upright frame, then uses the exact rotated source-to-preview transform to render subjects. |
| 4. Aura interaction | Selection, aura-core, and scan implementations built; physical acceptance pending | Tapping a projected subject selects only that track, updates the HUD, and clears selection when the track disappears. Server profiles drive a bounded local `AUR/s` random walk; double-tap on the selected track runs a local scan and shows base/modifier/final/classification. Verify on the phone, then add effects/audio/haptics. |
| 5. Performance and release | Not started | Record measured p50/p95, fallback configuration, demo evidence, and release readiness. |
