# Architecture Decision Records — AUR/S

## AI Maintenance Context

**Purpose:** Records decision rationale so later implementation does not reopen settled choices accidentally.  
**Current stage:** Stage 8 — the PyTorch segmentation baseline, aligned Android overlay, tap selection, local aura-core/scan logic, and local feedback are implemented; physical scan/audio/haptic and performance evidence are still pending.
**Update this file when:** a meaningful decision is made, reversed, or validated/refuted by measurement. Never rewrite a historical decision; append a superseding ADR.

## ADR-001: One Local Inference PC

**Status:** Accepted  
**Decision:** Use the RTX 4060 PC as the only live inference server; retain any other machine only as a fallback.  
**Why:** Splitting a single feed adds coordination and identity instability without helping the MVP.  
**Consequence:** Performance tuning happens on one known target machine.

## ADR-002: Native Android Kotlin

**Status:** Accepted  
**Decision:** Build an Android-only native Kotlin client with CameraX and Compose.  
**Why:** Camera frames, low-latency rendering, audio, haptics, and lifecycle control are core work.  
**Consequence:** No cross-platform client in MVP.

## ADR-003: WebSocket JPEG Metadata Pipeline

**Status:** Accepted  
**Decision:** Send reduced JPEG frames to the PC over WebSocket; return metadata, not processed video.  
**Why:** It is the smallest LAN transport that proves the experience.  
**Consequence:** WebRTC is deferred until actual measurements show this path cannot meet latency targets.

## ADR-004: Latest Frame Wins

**Status:** Accepted  
**Decision:** Every pipeline boundary has a maximum effective queue size of one.  
**Why:** A current lower-FPS overlay is better than a smooth delayed one.  
**Consequence:** Dropped frames are normal and must not be treated as errors.

## ADR-005: Segmentation Before Pose

**Status:** Accepted  
**Decision:** Use person segmentation/tracking; do not include pose in MVP.  
**Why:** Auras need rough silhouettes; aura values do not depend on body joints.  
**Consequence:** Add pose only for a concrete post-MVP effect that needs it.

## ADR-006: Aura Is Local Fiction

**Status:** Accepted  
**Decision:** The server assigns profiles once per temporary track; the phone generates live readings and scans.  
**Why:** This keeps the effect responsive, deterministic enough for a track, and clearly separate from vision.  
**Consequence:** There is no server round-trip per displayed digit or scan.

## ADR-007: TensorRT Is a Measured Optimization

**Status:** Baseline accepted; final quality model pending benchmark  
**Decision:** Start Step 4 with `yolo26n-seg.pt` in PyTorch, then compare `yolo26s-seg.pt` and export the benchmark winner to a fixed-shape FP16 TensorRT engine only if required.  
**Why:** Correctness and real end-to-end latency determine model choice, not nominal GPU utilization.  
**Consequence:** Model artifact/version and benchmark outcome must be recorded before release.

## ADR-008: Automatic Device Selection With CPU Fallback

**Status:** Accepted for development baseline  
**Decision:** Resolve `AURA_DEVICE=auto` to CUDA device 0 when PyTorch reports CUDA availability; otherwise run on CPU and keep the server usable.  
**Why:** The same code path must be testable on development machines without a working CUDA build, while the RTX 4060 remains the target performance device.  
**Consequence:** CPU timings are not release evidence; record the actual CUDA/PyTorch setup before the performance gate.
