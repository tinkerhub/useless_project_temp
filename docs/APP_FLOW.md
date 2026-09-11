Revised App Flow
HOME
  ↓
UPLOAD VIDEO
  ↓
VIDEO VALIDATION
  ↓
ANALYSIS SETUP
  ↓
PEN + FINGER DETECTION
  ↓
FRAME-BY-FRAME TRACKING
  ↓
KINETIC ANALYSIS
  ↓
RPM + CENTER ACCURACY + WOBBLE
  ↓
RESULTS DASHBOARD
  ↓
ANALYSIS REPLAY
1. Home

Quantum Pen Flip Predictor

Upload a pen-spinning video and analyze your technique.

Button:

Upload Video

No recording option. One job, one button, fewer chances for the interface to become a small bureaucratic nightmare.

2. Upload Video

User selects a video.

Immediately display:

Video thumbnail
Duration
Resolution
FPS
File size

Then:

Analyze Video

The system should check whether the video is suitable for analysis.

✓ Video loaded
✓ 240 FPS detected
✓ Resolution suitable
✓ Pen visible
3. Analysis Setup

Show the uploaded video with detection overlays.

The system identifies:

Pen
Pen bounding box
Pen center
Finger / rotation center

User sees:

PEN DETECTED ✓
ROTATION CENTER DETECTED ✓
TRACKING READY ✓

Then analysis starts automatically or with:

Start Analysis

4. Processing

This is where the actual computer vision happens:

Video
 ↓
Frame Extraction
 ↓
Pen Detection
 ↓
Bounding Box
 ↓
Finger Center Detection
 ↓
Frame Tracking
 ↓
Position / Velocity / Acceleration
 ↓
Angular Displacement
 ↓
RPM
 ↓
Center Accuracy
 ↓
Wobble

The PRD already establishes the frame-by-frame tracking, bounding-box data, angular calculations, and trajectory analysis as the technical basis.

5. Analysis View

While processing, show the video with the HUD:

┌──────────────────────────────┐
│                              │
│          VIDEO               │
│                              │
│       ┌─────────┐            │
│       │  PEN    │            │
│       └─────────┘            │
│            ●                 │
│       rotation center        │
│                              │
│   ─────────────────────      │
│   RPM       742              │
│   CENTER    94%              │
│   WOBBLE    3.8%             │
│                              │
└──────────────────────────────┘
6. Results

Once analysis finishes:

87 / 100
Overall Technique Score

Then the three primary results:

RPM
742 RPM

Center Accuracy
94%

Wobble
3.8%

And supporting metrics:

Average velocity
Peak acceleration
Tracking confidence
Number of rotations
7. Performance Breakdown

Show the user why they got the score.

Speed
742 RPM

Control
94% center accuracy

Stability
3.8% wobble

Then show the trajectory graph and RPM/wobble timeline.

8. Replay

The user can replay the uploaded video with the analysis overlay:

Pen bounding box
Rotation center
Trajectory trail
RPM
Wobble indicator
Center deviation

This is especially useful for the hackathon because the judges can immediately see the system working rather than being asked to admire a pile of statistics.

Final Navigation

Keep the app to four main screens:

1. HOME
      ↓
2. UPLOAD
      ↓
3. ANALYSIS
      ↓
4. RESULTS
      ↓
   REPLAY

I’d avoid adding separate screens for velocity, acceleration, calibration, and kinetics. Those are analysis layers, not user goals.

Your user's actual journey is simply:

Upload → Analyze → Understand → Improve