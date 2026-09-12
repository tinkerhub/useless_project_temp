# UX and Interaction Specification — AUR/S

## AI Maintenance Context

**Purpose:** Defines user-visible states and gesture behavior before implementation spreads them across camera, overlay, and HUD code.  
**Current stage:** Stage 8 — subject tracking, aligned contours, temporary IDs, single-subject tap selection, local live readings, double-tap scan, and baseline feedback are implemented; physical feedback acceptance remains.
**Update this file when:** a gesture, state transition, accessibility behavior, label, or error presentation changes in the built app.

## 1. Screen Structure

```text
┌──────────────────────────────────────────┐
│ AURA RADIATION MONITOR        LINK: OK   │
│                                          │
│          SUBJECT 04                      │
│          18,472 AUR/s                    │
│       [glow / contour / reticle]         │
│                                          │
│ FIELD: 8,421 AUR/s          ACTIVE: 5    │
└──────────────────────────────────────────┘
```

- The camera preview dominates the screen.
- The overlay layer draws subject auras, labels, reticles, and scan transitions.
- Compose HUD elements show connection state, active count, field text, mute control, and the result card.

## 2. Interaction Model

| Trigger | Precondition | Result |
|---|---|---|
| Tap a subject | Subject is current and visible | It becomes the sole selected subject; its live reading appears. |
| Tap another subject | A subject is selected | Selection moves; previous live reading disappears. |
| Double-tap selected subject | Selected subject is current | Begin 0.8–1.2 s local scan and reveal one result. |
| Double-tap unselected subject | Subject is current | Select it first; do not accidentally scan on the first gesture. |
| Subject expires | Selected subject lost beyond grace period | Clear selection and fade the UI state. |
| Socket becomes stale | No fresh `frame_state` | Show `DEGRADED`, fade overlays, retain local preview. |
| Socket closes | Connection lost | Show `OFFLINE`, disable selection and scan, attempt reconnect. |

## 3. Visual States

### Unselected subject

Temporary label, a low-intensity coloured outline/glow, no numeric reading.

### Selected subject

Brighter aura, targeting reticle, persistent ID, and a smooth non-negative `AUR/s` number. Other fields dim slightly but remain visible.

### Scanning

Freeze only the scan presentation, never the camera preview. Show a safe-area-centered `SCANNING SUBJECT NN…` card with a visible progress bar, a restrained pulse when system animations are enabled, and fake calibration phrases. Trigger a short optional tone and non-essential haptic at scan start/completion. Keep the completed result card centered and block repeated scan triggers until the current scan finishes.

### Result

Show a compact card with base, one modifier, final result, and classification. The result persists briefly, then fades to the selected live state.

## 4. Copy and Tone

- Keep labels short, large, and legible: `SUBJECT 04`, `AURA OVERFLOW`, `LINK: OK`.
- Fake-science phrases are allowed in scan animation, not in error messages.
- Connection and permission errors use direct language: `CAMERA PERMISSION REQUIRED`, `VISION LINK OFFLINE`.
- Always clarify in the about/help copy that results are fictional.

## 5. Accessibility Baseline

- Never communicate selection or result class through colour alone; retain text/icon/shape cues.
- Use sufficient contrast for primary labels over the camera preview; draw a shadow/backplate when necessary.
- Respect the device's animation-reduction setting by reducing particles/glitch intensity.
- Sound is optional and muteable through the visible session `SOUND ON`/`SOUND OFF` control; haptics never carry unique required information.
- Interactive targets outside moving subjects use standard Android touch target sizing.

## 6. Coordinate and Gesture Rules

The renderer and hit-test layer use the same source-to-preview transform. CameraX binds Preview and Analysis to a shared viewport; the client transmits that crop after rotation and uses the per-frame transform from those `ImageProxy` pixels to `PreviewView`. Preview crop, aspect ratio, rotation, and mirroring are therefore applied exactly once. A box is an acceptable temporary hit region if no valid contour is available.
