# Useless 3.0 — Technical Requirements Document

**Version:** 1.0
**Status:** Ready for Technical Implementation
**Architecture:** Client-first interactive web application

---

# 1. Technical Objective

Build a performant, responsive landing page with an embedded real-time webcam experience capable of determining:

```text
NO FACE
SILENT
TALKING
```

and triggering corresponding:

```text
VISUAL RESPONSE
+
AUDIO RESPONSE
```

The original technical concept describes a pipeline based on webcam input, face detection, facial landmarks, mouth movement analysis and state-based reactions.

---

# 2. Recommended Architecture

```text
                    WEB BROWSER
                         │
                         ▼
                 ┌───────────────┐
                 │ React / Next  │
                 │      UI       │
                 └───────┬───────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       Camera Manager          UI State Manager
              │                     │
              ▼                     ▼
        Video Stream          Current State
              │                     │
              ▼                     │
       Vision Processor             │
              │                     │
       ┌──────┴──────┐              │
       ▼             ▼              │
 Face Detection   Landmarks         │
       │             │              │
       └──────┬──────┘              │
              ▼                     │
       Mouth Analyzer               │
              │                     │
              ▼                     │
       State Classifier ────────────┘
              │
       ┌──────┴───────┐
       ▼              ▼
 Audio Manager    Visual Manager
```

---

# 3. Recommended Frontend Stack

### Framework

**Next.js + React + TypeScript**

Reasons:

* Component architecture
* Strong TypeScript support
* SEO
* Easy deployment
* Good performance
* Good developer experience

### Styling

Recommended:

**Tailwind CSS**

with CSS variables for:

* typography
* spacing
* borders
* colors
* animation timing

### Animation

Recommended:

**Framer Motion**

Use it for:

* section reveals
* state transitions
* metric animations
* CTA interactions
* technical diagrams

Avoid animating every camera frame through React state.

---

# 4. Application Structure

Recommended structure:

```text
src/
│
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── Navbar/
│   ├── Hero/
│   ├── BigIdea/
│   ├── HowItWorks/
│   ├── Demo/
│   ├── StateCards/
│   ├── DetectionPipeline/
│   ├── Technology/
│   ├── UselessnessScore/
│   ├── Privacy/
│   ├── FAQ/
│   ├── FinalCTA/
│   └── Footer/
│
├── features/
│   └── camera/
│       ├── CameraManager.ts
│       ├── FaceDetector.ts
│       ├── MouthAnalyzer.ts
│       ├── StateClassifier.ts
│       ├── AudioManager.ts
│       └── types.ts
│
├── assets/
│   ├── audio/
│   └── images/
│
└── lib/
    ├── constants.ts
    └── analytics.ts
```

---

# 5. Camera Architecture

Camera access should use:

```javascript
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: false
})
```

Important:

**The application does not need microphone permission for the specified detection approach.**

Talking detection is based on visual mouth movement rather than audio input.

---

# 6. Camera Lifecycle

```text
IDLE
 │
 ▼
REQUEST_PERMISSION
 │
 ├── DENIED ───────► PERMISSION_ERROR
 │
 ▼
CAMERA_READY
 │
 ▼
PROCESSING
 │
 ▼
STOP
```

When leaving the experience:

* Stop the MediaStream tracks.
* Release the camera.
* Stop vision processing.
* Stop or clean up audio.
* Remove animation loops.

---

# 7. Vision Processing

The detection engine should process frames independently from the React rendering lifecycle.

Recommended approach:

```text
requestAnimationFrame()
        ↓
Capture frame
        ↓
Run detector
        ↓
Extract landmarks
        ↓
Calculate mouth metrics
        ↓
Update classifier
```

Do **not** perform heavy vision calculations through frequent React `setState()` calls.

Use a dedicated processing layer.

---

# 8. Face Detection

The detector must answer:

```text
Is a face currently visible?
```

Output:

```typescript
interface FaceDetectionResult {
  detected: boolean;
  landmarks?: FaceLandmark[];
  confidence?: number;
}
```

If no face is detected:

```text
FACE → NO_FACE
```

should trigger the appropriate state transition.

---

# 9. Facial Landmark Processing

The mouth region should be derived from facial landmarks.

Conceptually:

```text
FACE
 │
 └── MOUTH LANDMARKS
        │
        ├── Upper lip
        ├── Lower lip
        └── Mouth corners
```

Calculate a mouth-opening metric.

For example:

```text
mouthHeight
    /
mouthWidth
```

This produces a normalized mouth-opening value.

---

# 10. Talking Detection

The system must **not** classify talking from a single frame.

Instead:

```text
Frame 1 → mouth metric
Frame 2 → mouth metric
Frame 3 → mouth metric
Frame 4 → mouth metric
...
```

Create a rolling time window.

Example conceptual logic:

```text
Mouth movement
       ↓
Temporal buffer
       ↓
Movement threshold
       ↓
Minimum duration
       ↓
Talking confidence
       ↓
TALKING / SILENT
```

This follows the supplied requirement that the system analyzes mouth movement over time rather than simply asking whether the mouth moved.

---

# 11. State Machine

The central application state should be a finite state machine.

```typescript
type DetectionState =
  | "IDLE"
  | "NO_FACE"
  | "SILENT"
  | "TALKING";
```

Transitions:

```text
IDLE
 │
 ▼
NO_FACE
 │
 ▼
SILENT
 │
 ▼
TALKING
 │
 ▼
SILENT
 │
 ▼
NO_FACE
```

Possible direct transitions should also be supported:

```text
NO_FACE → TALKING
NO_FACE → SILENT
TALKING → NO_FACE
SILENT → NO_FACE
```

---

# 12. State Stability / Debouncing

Raw detection will fluctuate.

Example:

```text
TALKING
SILENT
TALKING
SILENT
TALKING
```

within a fraction of a second should not produce five state changes.

Implement:

### Enter threshold

State must satisfy the condition for a minimum duration.

### Exit threshold

State must fail the condition for a minimum duration.

This provides hysteresis.

Example:

```text
TALKING ENTER
    300–500ms sustained detection

TALKING EXIT
    500–800ms sustained silence
```

Exact values should be tuned during testing.

---

# 13. Audio Manager

Audio should be centralized.

```typescript
interface AudioManager {
  playForState(state: DetectionState): void;
  stop(): void;
  preload(): void;
}
```

The manager must:

* Prevent unnecessary overlap.
* Track currently playing audio.
* Handle state transitions.
* Avoid restarting identical audio repeatedly.
* Clean up when experience ends.

The supplied concept explicitly requires preventing unnecessary audio restarts and overlap.

---

# 14. Audio State Mapping

```typescript
const AUDIO_MAP = {
  TALKING: "/audio/talking.mp3",
  SILENT: "/audio/silent.mp3",
  NO_FACE: "/audio/no-face.mp3"
};
```

The actual filenames can change.

Audio should be preloaded after user interaction where browser autoplay restrictions require it.

---

# 15. Visual State Manager

Visual state should map directly to detection state.

```typescript
const VISUAL_MAP = {
  TALKING: talkingVisual,
  SILENT: silentVisual,
  NO_FACE: noFaceVisual
};
```

Transition:

```text
Current state
      ↓
State changed?
      ↓
YES
      ↓
Animate visual transition
```

---

# 16. Camera UI

The demo should display:

```text
┌──────────────────────────────┐
│                              │
│         CAMERA FEED          │
│                              │
│      [FACE LANDMARKS]        │
│                              │
│      FACE DETECTED            │
│                              │
└──────────────────────────────┘

CURRENT STATE

🗣️ TALKING

● DETECTION ACTIVE
```

Optional advanced mode:

```text
FACE CONFIDENCE: 94%
MOUTH ACTIVITY: 72%
STATE: TALKING
```

This should be optional because the primary experience should remain simple.

---

# 17. Rendering Strategy

The camera video should be rendered using:

```html
<video>
```

For processing overlays:

```html
<canvas>
```

Recommended architecture:

```text
Video
 │
 ├── User-visible camera feed
 │
 └── Canvas overlay
       ├── Face box
       ├── Landmark visualization
       └── Debug information
```

Canvas should not be used to continuously replace the actual video element unless required.

---

# 18. Performance Requirements

Target:

```text
UI rendering:       60 FPS
Vision processing:  ~10–30 FPS
Camera resolution:  adaptive
```

There is no need to process every camera frame.

For example:

```text
Camera: 30 FPS
Vision: 15 FPS
UI:     60 FPS
```

This separation reduces CPU/GPU load.

---

# 19. Mobile Optimization

Mobile devices have limited CPU/GPU resources.

Implement:

* Lower processing resolution
* Reduced detector frequency
* Smaller canvas
* Pause processing when tab is hidden
* Stop camera when experience is closed

Use:

```javascript
document.visibilityState
```

to detect hidden tabs.

---

# 20. Permission Handling

Possible states:

```text
NOT_REQUESTED
REQUESTING
GRANTED
DENIED
ERROR
```

If denied:

Display:

> Your camera remains mysterious.

Then provide:

**TRY AGAIN**

and a non-camera explanation/demo.

---

# 21. Privacy Architecture

Preferred architecture:

```text
USER CAMERA
     ↓
LOCAL BROWSER
     ↓
VISION PROCESSING
     ↓
STATE
     ↓
AUDIO + VISUAL
```

No camera frames should be sent to a server.

No camera footage should be stored.

No biometric profile should be generated.

If the actual implementation differs, the privacy copy must be updated accordingly.

---

# 22. Analytics Architecture

Analytics events should contain only non-sensitive metadata.

Allowed:

```json
{
  "event": "experience_started"
}
```

Not allowed:

```json
{
  "camera_frame": "...",
  "face_data": "...",
  "landmarks": "..."
}
```

Never transmit raw webcam frames through analytics.

---

# 23. Component Requirements

## Navbar

Props:

```typescript
{
  onLaunch: () => void;
}
```

---

## Hero

Actions:

```text
Start Experience
See How It Works
```

---

## Demo

Responsibilities:

* Camera permission
* Camera lifecycle
* Detection
* Current state
* Audio
* Visual reaction
* Stop/reset

---

## StateCard

Props:

```typescript
{
  state: DetectionState;
  title: string;
  description: string;
  visual: string;
  audioDescription: string;
}
```

---

## FAQ

Accordion behavior:

* One or multiple open items
* Keyboard accessible
* Smooth height animation
* Semantic buttons

---

# 24. Error Handling

Handle:

### Camera unavailable

```text
Camera unavailable.
```

### Permission denied

```text
Camera permission denied.
```

### Detector initialization failed

```text
Vision system couldn't start.
```

### Unsupported browser

```text
Your browser doesn't support this experience yet.
```

### Unexpected runtime error

Fallback to:

```text
STATIC DEMO MODE
```

The landing page itself must remain usable even if the camera experience fails.

---

# 25. Security Requirements

* HTTPS in production.
* No camera data uploads.
* No unnecessary third-party scripts.
* Content Security Policy where practical.
* Sanitize externally supplied content.
* Do not expose API keys in client-side source.
* Avoid unnecessary backend services.

---

# 26. SEO

Required metadata:

```text
Title:
Your Camera Knows When You're Talking | Useless 3.0

Description:
A completely unnecessary AI-powered computer vision experiment
that detects when you're talking.

Open Graph image:
Useless 3.0 social preview
```

Use semantic:

```html
<header>
<nav>
<main>
<section>
<footer>
```

---

# 27. Accessibility Technical Requirements

All interactive elements must have:

* Accessible names
* Keyboard support
* Focus states

Camera status should use an accessible live region where appropriate:

```html
aria-live="polite"
```

Example:

```text
Current state: Talking
```

Animations must respect:

```css
prefers-reduced-motion
```

---

# 28. Testing Strategy

## Unit Tests

Test:

* Mouth metric calculations
* Talking classifier
* State transitions
* Debouncing
* Audio mapping

Example:

```text
mouth movement sustained
→ TALKING
```

```text
face detected + no movement
→ SILENT
```

```text
face disappears
→ NO_FACE
```

---

# 29. Integration Tests

Test:

```text
Camera
 ↓
Detector
 ↓
Classifier
 ↓
State Manager
 ↓
Audio
 ↓
Visual
```

Verify that a state change produces exactly one appropriate reaction.

---

# 30. Browser Testing

Minimum matrix:

| Browser | Desktop | Mobile |
| ------- | ------: | -----: |
| Chrome  |       ✓ |      ✓ |
| Edge    |       ✓ |      ✓ |
| Firefox |       ✓ |      ✓ |
| Safari  |       ✓ |      ✓ |

Camera permission behavior should be manually verified on real devices.

---

# 31. Performance Testing

Measure:

* Initial load
* JS bundle size
* FPS
* CPU usage
* Memory usage
* Camera initialization time
* Detection latency

Target:

```text
State reaction latency < 500ms
```

where technically practical.

---

# 32. Deployment

Recommended:

```text
GitHub
   ↓
CI/CD
   ↓
Production Hosting
```

Suitable platforms include a modern static/SSR web host.

Production must run over HTTPS because camera access requires a secure context.

---

# 33. Environment Variables

Only use environment variables for values that genuinely require configuration.

Example:

```env
NEXT_PUBLIC_ANALYTICS_ID=
NEXT_PUBLIC_PROJECT_URL=
```

Do not put secrets into `NEXT_PUBLIC_*`.

If no backend is required, the project should ideally have zero secrets.

---

# 34. Definition of Done

The project is considered complete when:

### Landing Page

* [ ] Hero implemented
* [ ] Navbar implemented
* [ ] Big Idea implemented
* [ ] How It Works implemented
* [ ] Three States implemented
* [ ] Technology section implemented
* [ ] Uselessness Score implemented
* [ ] Privacy section implemented
* [ ] FAQ implemented
* [ ] Final CTA implemented
* [ ] Footer implemented

### Camera

* [ ] Permission flow works
* [ ] Camera preview works
* [ ] Face detection works
* [ ] Mouth landmarks work
* [ ] Talking detection works
* [ ] Silent detection works
* [ ] No-face detection works
* [ ] State transitions are stable

### Audio

* [ ] Talking audio works
* [ ] Silent audio works
* [ ] No-face audio works
* [ ] Audio doesn't overlap unnecessarily
* [ ] Repeated triggers are prevented

### UX

* [ ] Responsive
* [ ] Accessible
* [ ] Reduced motion supported
* [ ] Error states implemented
* [ ] Camera cleanup implemented

### Privacy

* [ ] Camera data handling documented
* [ ] No unintended camera uploads
* [ ] No camera storage
* [ ] Analytics contains no camera data

### Production

* [ ] HTTPS
* [ ] SEO metadata
* [ ] Social preview
* [ ] Performance tested
* [ ] Browser tested
* [ ] Production deployment verified

---

# 35. Engineering Principle

The implementation should follow one rule:

> **The product can be useless. The engineering cannot be.**

The experience should feel ridiculous to the user, but the underlying implementation should demonstrate:

* Clean architecture
* Real-time computer vision
* Stable state management
* Efficient rendering
* Good UX
* Privacy-conscious camera handling
* Robust error handling
* Production-quality frontend engineering

That contrast is what makes the project compelling for a hackathon.
