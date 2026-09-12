# Aura Detector — Internal Build Guide

**Audience:** AI agents and implementers.  
**Current stage:** Step 8 — the Android subject-overlay baseline, tap selection, local aura-core, local scan, and feedback implementations compile and install. Physical scan/audio/haptic acceptance and performance measurement remain.
**Purpose:** Turns the product/technical documents into the safest next execution order.  
**Update this file when:** a phase starts or finishes, an actual command/setup differs, a benchmark changes the recommended model/configuration, or a discovered constraint changes the build order. Do not claim a phase is complete without its stated definition-of-done evidence.

This is the implementation companion to [the product plan](aura-radiation-monitor-plan.md). Build the vertical slice first: **phone frame → PC detection → phone box overlay**. Do not build aura effects, TensorRT, interference, or polished UI until that loop is fast and stable.

## 0. Lock the MVP

The first shippable demo does exactly this:

1. An Android phone sends its newest camera JPEG to a PC on the same Wi-Fi network.
2. The PC finds and tracks up to six people.
3. The phone draws current subject IDs and boxes over its local camera preview.
4. A tap selects one subject; a double tap produces the fake aura scan.

Keep these out of the MVP: face recognition, pose, custom training, WebRTC, cloud services, recording, ReID, interference, and a second inference PC. They do not make the first demo work better.

## 1. Prepare the Machines and Network

### PC (inference server)

- Use the RTX 4060 machine as the only live inference server.
- Install a supported NVIDIA driver, Python 3.11, and a CUDA-enabled PyTorch build.
- Create a Python virtual environment in `server/.venv`; keep dependencies in `server/requirements.txt`.
- Connect the PC and Android device to the same dedicated 5 GHz / Wi-Fi 6 network if possible. Disable VPNs during testing.
- Do not use captive-portal or client-isolated college/public Wi-Fi for the live link. Use a direct phone/PC hotspot so the phone can reach the PC without a login redirect.
- Reserve or note the PC's LAN IP. Test it from the phone browser before building the Android client.
- Allow the chosen local TCP port through Windows Firewall only on Private networks.

### Android development machine

- Install current Android Studio with the Android SDK and a physical-device USB driver.
- Use a physical Android phone, not an emulator, for camera and Wi-Fi latency work.
- Enable developer options and USB debugging; confirm that a minimal app installs and opens.

### Definition of done

- The PC exposes a local health endpoint, for example `http://PC_IP:8765/health`.
- The phone can open that endpoint while both devices are on the demo network.
- The app's Internet permission and clear-text local-network policy are configured for development.

## 2. Create the Smallest Project Structure

Use two independently runnable components:

```text
Aura_Detector/
├── aura-radiation-monitor-plan.md
├── AURA_DETECTOR_BUILD_GUIDE.md
├── server/
│   ├── app.py                 # HTTP health check + WebSocket endpoint
│   ├── pipeline.py            # newest-frame inference and tracking
│   ├── protocol.py            # request/response validation and DTOs
│   ├── aura.py                # deterministic profiles and scan results
│   ├── requirements.txt
│   └── tests/
└── android/
    └── AuraDetector/          # normal Android Studio project
```

Keep the server modules plain Python. Do not add a database, message broker, Docker, microservices, or dependency-injection framework. The app is one phone and one PC on a LAN.

Create the Android project as Kotlin, min SDK 26 or higher, with Jetpack Compose enabled. Start with CameraX, OkHttp WebSocket, and standard Android audio/haptic APIs. Add no other library until a concrete feature needs it.

### Definition of done

- `server` starts from its virtual environment.
- The Android project builds and shows a screen with its server-address setting.
- Both sides can be run separately and committed independently.

## 3. Prove Transport Before Adding AI

Implement one WebSocket endpoint, `/ws`, and use a tiny versioned protocol:

```json
// phone → PC
{"type":"frame","version":1,"frameId":42,"capturedAtMs":123456,"jpegBase64":"..."}

// PC → phone
{"type":"frame_state","version":1,"frameId":42,"serverReceivedAtMs":123470,"subjects":[]}
```

For efficiency, make each side own a single latest-item slot:

- Android CameraX uses `STRATEGY_KEEP_ONLY_LATEST`.
- The phone sends a new frame only when no send is in flight, or replaces its pending frame.
- The PC overwrites the pending frame when a newer one arrives.
- The response includes the original `frameId`; the phone ignores older responses.

Start at 640×360 JPEG, quality around 70, and cap transmission at 12–15 FPS. Render the phone's local preview immediately; never wait for the PC to return video.

### Definition of done

- The server echoes `frameId` and a timestamp.
- The app displays capture-to-response latency and reconnects after a dropped socket.
- Walking past the camera never produces a backlog of old acknowledgements.

## 4. Add Person Detection, Then Tracking

Start with `yolo26n-seg.pt`, the nano instance-segmentation checkpoint. Detect only COCO class `person`.

1. Load the model once when the server starts; never load it per frame.
2. Run one warm-up inference before accepting the first client frame.
3. Run detection on the newest decoded image.
4. Enable BoT-SORT tracking with ReID disabled (`tracker="botsort.yaml"`).
5. Confirm a new track only after 3 consecutive detections.
6. Retain a lost track for about one second, then remove it.
7. Rank tracks by confidence × visible area and return no more than six; keep the selected ID when it remains visible.

Return normalized coordinates so each phone layout can scale them correctly:

```json
{
  "id": 4,
  "confidence": 0.91,
  "box": [0.31, 0.18, 0.21, 0.62],
  "contour": [[0.32, 0.19], [0.37, 0.21]]
}
```

`box` is `[x, y, width, height]`, with all values in `0..1`. Simplify the segmentation contour on the PC before sending it. Initially, send only boxes if contours are unstable; a correct box overlay is more useful than a broken silhouette effect.

### Current implementation evidence

- `server/pipeline.py` loads the checkpoint once, warms it once, decodes incoming JPEGs with OpenCV, filters to class `person`, runs BoT-SORT, caps output at six subjects, and emits normalized boxes plus simplified contours.
- `ScannerScreen.kt` downscales every camera payload to a maximum 640-pixel long edge before JPEG encoding; a high-resolution camera frame therefore cannot violate the protocol's 1920×1080 input limit.
- `server/tests/test_pipeline.py` verifies person filtering, confidence ranking, subject cap, normalized coordinates, contour bounds, fallback IDs, and malformed JPEG handling.
- Device selection is automatic: CUDA device 0 when available, otherwise CPU. The development environment currently reports CPU-only PyTorch, so the RTX 4060 performance gate is still open.
- The private-hotspot smoke test has received live `frame_state` acknowledgements before and after the shared-viewport/crop/rotation fix (`FRAME: 17`, 315 ms; final check: `FRAME: 27`, 350 ms). These are smoke-test observations, not person-track or p95 performance acceptance results.

### Definition of done still pending

- A walking person retains the same subject ID most of the time in a live phone-to-PC run.
- The phone's overlay follows the local preview without obvious stale lag.
- The server maintains its target rate with six subjects and reports inference time.

## 5. Build the Android Overlay and Selection

Render three layers in this order:

```text
CameraX PreviewView
        ↓
custom Canvas/View for boxes, contours, glows, particles, and reticle
        ↓
Compose HUD for connection state, controls, and scan card
```

Use one custom Canvas layer for all per-frame drawing. Keep Compose out of the high-frequency particle/mask path.

### Current implementation evidence

- `AuraWebSocket` parses up to six current `frame_state.subjects` with normalized boxes and optional simplified contours, retaining each acknowledged frame's cropped, upright source size and CameraX source-to-preview transform.
- `ScannerScreen` binds preview and analysis in one CameraX `UseCaseGroup` using `PreviewView.viewPort`, transmits that same crop after rotation, and configures the per-frame CameraX transform with that rotation before projecting response coordinates into `PreviewView` for the Canvas outline/contour and `SUBJECT #id` label.
- The debug APK compiles and is installed. A portrait walking-person run confirmed live tracking and a tap at `(500, 900)` selected `SUBJECT #565`; landscape and expiry edge-case checks remain.

Implement coordinate mapping once. The server frame and PreviewView may have different aspect ratios or rotation; map normalized source coordinates through the exact preview crop/rotation transform before drawing or hit-testing. Test portrait and landscape before spending time on effects.

Selection behavior:

- On a single tap, hit-test the current selected subject list, using a contour when present and otherwise the box.
- Set one `selectedSubjectId`; clear it if the track expires.
- On a double tap of that selected subject, start a local scan animation.
- The server keeps tracking IDs; the phone owns selection, animation, audio, and haptics.

### Definition of done

- Taps select the person the user touched in portrait mode.
- Switching selection updates the sole highlighted subject and removes the previous selection state.
- The UI explicitly shows `LINK: OK`, `DEGRADED`, or `OFFLINE`; it never treats stale data as live.

## 6. Add Deterministic Aura Profiles

Do not let every frame generate new identity values. On the server, create one hidden session seed at connection time. For a newly confirmed track, derive its profile from `sessionSeed + trackId` and store it for the track lifetime.

Each profile contains only data needed by the client:

```text
subject ID, band, minimum, maximum, palette, visual type, infinite flag
```

Send a profile on its first appearance and send only normal tracking updates afterward. The phone uses a stateful, bounded random walk for the selected subject's live number, so values feel alive without network chatter.

Use log-space movement for broad ranges and clamp every finite result to its band. Treat infinity as a named state, never a floating-point value used in ordinary arithmetic.

### Current implementation evidence

- `AuraWebSocket` parses the server's stable `band`, `min`, `max`, and `palette` profile fields without adding per-reading network traffic.
- `ScannerScreen` owns one bounded `AuraValueGenerator` per selected track, updates the selected value locally every 160 ms, clamps finite bands, and treats `∞` as a named display state.
- `ScannerScreen` handles selected-subject double-taps with a one-second local scan, deterministic finite/infinity result generator, and a result card containing base, modifier, final, and classification.
- The scan card is explicitly top-layered in a safe center region with a visible progress bar; subject labels and live readings are clamped inside the preview instead of being drawn above an off-screen box.
- The scan card now has a reduced-motion-aware pulse. Scan start/completion use brief system haptics and optional `ToneGenerator` cues; the visible `SOUND ON`/`SOUND OFF` control mutes only audio.
- The debug APK installs on the authorized phone and held `LINK: OK` through `FRAME: 130` after a CameraX main-thread transform guard. Live reading and scan/feedback behavior still need their full manual acceptance run.

### Definition of done

- A given subject's band and colour do not change while tracked.
- A selected live value changes smoothly within the assigned finite range.
- Losing and later reacquiring a track may intentionally create a new profile.

## 7. Implement the Scan as a Local Feature

The double-tap scan does not need a server round trip. The phone already has the profile and can generate the result with a local random generator.

Build it in this sequence:

1. 800–1,200 ms scan state with reticle and fake calibration text.
2. Generate a finite signed base result, milestone, extreme value, `+∞`, or `-∞` according to the plan's weighted distribution.
3. Generate one explicit blessing or curse modifier.
4. Resolve the display result with special infinity rules.
5. Show a compact result card: base, modifier, final, classification.
6. Trigger the matching visual effect, sound, and haptic event.

Keep randomness testable: isolate the weighted choice and formatter in a small pure function, accept an injectable seed in tests, and never use random output to choose UI state in several separate places.

### Definition of done

- Double-tapping produces one coherent result card and effect.
- Finite results show a `+` or `−` sign; `±∞` displays correctly and does not crash formatting.
- The live `AUR/s` remains non-negative and separate from the instantaneous scan result.

## 8. Make the Effects Readable Before Making Them Fancy

Implement in this order:

1. subject label and coloured outline;
2. blurred/stroked glow around box or contour;
3. selected reticle and brighter alpha;
4. expanding pulse on scan completion;
5. small particle burst;
6. result-specific colour/glitch/bloom variants;
7. Geiger beep rate and short haptic cues.

Throttle particles and reuse drawing objects. Stop or reduce effects for subjects outside the top six. Ensure the label, selected reading, and scan state remain readable over every effect.

### Definition of done

- With six people visible, scrolling/drawing remains smooth on the target phone.
- Sound is muted by default or has an obvious toggle for a crowded demo setting.
- Visual effects do not hide the subject ID or selection reticle.

## 9. Optimize Only From Measurements

Log these per frame: capture time, send time, server receive time, decode time, inference/tracking time, response time, and client render time. Use the echoed `frameId` to calculate real end-to-end latency without clock synchronization.

Fix bottlenecks in this order:

1. stale-frame queues;
2. overly large JPEG frames or metadata;
3. slow model/input size;
4. expensive contour/effect drawing;
5. TensorRT export and FP16 engine on the actual RTX 4060.

Only export TensorRT after the PyTorch path is correct and measured. Use a fixed 640×640 FP16 engine, batch size 1, then warm it at startup. Keep the known-good PyTorch/nano checkpoint as fallback. Test the TensorRT engine on the same GPU, driver, and TensorRT environment used for the demo.

Targets:

| Measure | Target |
|---|---:|
| Median capture-to-overlay | <120 ms |
| p95 capture-to-overlay | <220 ms |
| p95 inference + tracking | <50 ms |
| Metadata response | <20 KB/frame |
| Fully rendered subjects | 6 maximum |

### Definition of done

- A recorded 10-minute crowd test meets the latency target at p95 or documents the exact bottleneck.
- The app selects current frames rather than smoothly rendering delayed history.
- A fallback model/config is selectable before the demo.

## 10. Add Interference Last

Only add this after the previous acceptance checks pass consistently. Two subjects become eligible when they are close for a short dwell time. Then roll a small chance per check, with a pair cooldown and a global cooldown. Keep it entirely on the phone because it is presentation logic, not vision.

### Definition of done

- It cannot trigger repeatedly while two people stand together.
- It never blocks detection, tracking, selection, or normal scans.

## 11. Test Like a Demo Team

Run these tests on the actual phone, PC, and venue-like network:

- one person, then six people, then a crowd;
- people crossing and briefly leaving frame;
- portrait/landscape rotation and camera preview crop;
- dark, bright, backlit, and mixed lighting;
- Wi-Fi drop, server restart, and reconnect;
- no-person scene and one partially visible person;
- rapid taps and double taps;
- every scan result class, including both infinities;
- CPU/GPU warm start and cold start;
- 15–30 continuous minutes for memory, heat, and socket stability.

Create a short scripted demo: start server, connect phone, scan three people, intentionally reveal a milestone/infinity seed if needed, then reconnect once. Keep a screen recording or mocked playback route only as a rehearsal fallback, not as the public runtime path.

## 12. Event-Day Checklist

1. Put phone and PC on the private demo network; confirm PC IP.
2. Start the server, health check, model load, and engine warm-up.
3. Open the app and wait for `LINK: OK`.
4. Verify one real subject ID, tap selection, scan, audio, and haptic.
5. Keep charger/power bank, USB cable, PC power supply, and backup hotspot ready.
6. Keep the PyTorch/nano model fallback and a written command to start it.
7. Disable OS sleep, screen lock, disruptive notifications, and automatic updates for the demo period.
8. Do not expose the server beyond the LAN; use a short-lived connection token.

## Suggested Git Milestones

| Commit | Must work |
|---|---|
| `server-health-and-android-shell` | phone reaches PC health endpoint |
| `latest-frame-websocket` | JPEG/ack loop has no backlog |
| `person-tracking-protocol` | IDs and normalized boxes return |
| `android-overlay-and-selection` | overlay and tap mapping work |
| `seeded-aura-profiles` | stable band, palette, live reading |
| `local-aura-scan` | double-tap result card and special states |
| `effects-audio-haptics` | readable polished feedback |
| `tensorrt-performance-pass` | measured target on the event PC |
| `interference-post-mvp` | optional cooldown-safe interaction |

## Final Completion Gate

The project is finished when a non-developer can connect the phone, point it at a small crowd, see stable labelled subjects, tap exactly one subject, receive an animated live reading and scan result, and recover cleanly from a momentary Wi-Fi interruption—all without explaining the system architecture.
