Front-End Design Guidelines
Quantum Pen Flip Predictor
1. Overall Design Direction

Use a dark technical dashboard rather than a conventional website.

The visual identity should feel:

Minimal
Futuristic
Technical
Data-driven
Premium
Slightly industrial

The reference uses a near-black background, dark charcoal cards, rounded corners, subtle borders, bright blue/purple accent colors, and large numerical readouts. Replicate that hierarchy rather than literally copying the mobile layout.

Core principle:

Dark canvas + restrained cards + one strong metric + vivid telemetry accents

2. Web Layout

Since this is a web application, I recommend a three-zone desktop layout rather than the three-phone arrangement in the reference.

┌─────────────────────────────────────────────────────────────────────┐
│ LOGO                Dashboard    Analyze    History        MENU      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  UPLOAD / VIDEO AREA                 ANALYSIS SUMMARY               │
│  ┌────────────────────────────┐      ┌───────────────────────────┐  │
│  │                            │      │       OVERALL SCORE        │  │
│  │       VIDEO PREVIEW        │      │          87/100            │  │
│  │                            │      │                           │  │
│  │    ┌───────────────┐       │      │ RPM              742       │  │
│  │    │     PEN       │       │      │ CENTER           94%       │  │
│  │    └───────────────┘       │      │ WOBBLE            3.8%     │  │
│  │          ● CENTER          │      │                           │  │
│  │      · · · · · · ·        │      │ TRACKING          97%       │  │
│  └────────────────────────────┘      └───────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PERFORMANCE                                                        │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────┐ │
│  │ RPM                  │ │ CENTER ACCURACY      │ │ WOBBLE      │ │
│  │      742             │ │       94%            │ │    3.8%     │ │
│  │   ╱──────╲           │ │   Excellent          │ │   Stable    │ │
│  └──────────────────────┘ └──────────────────────┘ └─────────────┘ │
│                                                                     │
│  TRAJECTORY / PERFORMANCE GRAPH                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │                     trajectory                               │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

The video remains the primary visual element, while the metrics sit beside it.

3. Navigation

Keep navigation extremely small.

Header

Left:

Quantum Pen Flip Predictor

Center/right:

Analyze
History

Right:

Settings

You don't need ten navigation items. The pen is already doing enough.

Header styling
Height: 64–72 px
Background: same as page, or slightly lighter
Bottom border: subtle
Logo: small geometric icon + wordmark
Navigation text: muted gray
Active page: white + blue accent
4. Color System

The reference's strongest visual characteristic is the dark background with vivid telemetry colors.

Background
Primary:      #0B0C0F
Secondary:    #111318
Card:         #171A20
Card Hover:   #1C2027
Border:       #292D35
Text
Primary:      #F4F5F7
Secondary:    #A2A6AE
Muted:        #686D76
Accent

Use electric blue as the primary brand color:

Primary Blue: #2488FF

Then use purple/magenta selectively for performance visualization:

Purple:       #C026FF

And status colors:

Success:      #36E2A0
Warning:      #FFB547
Danger:       #FF4D5A

Do not turn everything neon. The reference works because the bright colors are surrounded by lots of darkness.

5. Typography

Use a modern geometric sans-serif.

Good choices:

Inter
or
Manrope

Hierarchy
Page title        28–32 px / 600
Section title     18–20 px / 600
Metric number     42–56 px / 600
Normal text       14–16 px
Metadata          12–13 px

For major numbers like:

742 RPM

use a large, bold typeface with tight spacing.

Numbers should dominate the screen.

6. Upload Screen

Since you've decided the app should only accept uploaded videos, make this one of the central experiences.

Upload panel

Large rounded drop zone:

┌────────────────────────────────────┐
│                                    │
│              ↑                     │
│                                    │
│        DROP VIDEO HERE             │
│                                    │
│      or click to browse            │
│                                    │
│      MP4 · MOV · AVI               │
│                                    │
└────────────────────────────────────┘

Below it:

Recommended
120 FPS or 240 FPS

Once uploaded, replace the drop zone with a video preview.

Primary button

Analyze Video →

Bright blue, large, simple.

7. Analysis Screen

This should be the most visually impressive part of the product.

Video player

Use a large dark video container with:

Rounded corners
Subtle border
16:9 aspect ratio
Pen bounding box
Rotation center
Trajectory trail
Optional grid

Overlay telemetry in the corners.

Example:

┌──────────────────────────────────────────┐
│ TRACKING ●                               │
│                                          │
│                VIDEO                     │
│                                          │
│             ┌─────────┐                  │
│             │   PEN   │                  │
│             └─────────┘                  │
│                  ●                       │
│              · · · · ·                   │
│                                          │
│ RPM 742                     FRAME 0284   │
└──────────────────────────────────────────┘

This directly matches the HUD concept in the original PRD.

8. Metric Cards

Do not make every metric look like a gauge.

The reference uses the large speedometer because network speed is naturally represented as a dial. For your product, a dashboard is better.

Use three major cards:

RPM
RPM
742
+8.4%
Center Accuracy
CENTER ACCURACY
94%
EXCELLENT
Wobble
WOBBLE
3.8%
STABLE

Make the numbers huge and the labels small.

9. Overall Score

Put one large score above the individual metrics.

TECHNIQUE SCORE

       87

     / 100

Excellent Control

A circular progress ring could work very well here, borrowing the reference's gauge concept without copying it.

For example:

       ╭───────╮
      ╱         ╲
     │    87     │
     │   /100    │
      ╲         ╱
       ╰───────╯

Use the blue/purple gradient sparingly.

10. Performance Visualization

I recommend two graphs.

RPM timeline
RPM
800 ┤              ╭───╮
700 ┤──────╭───────╯   ╰───
600 ┤      ╰
    └──────────────────────
          TIME
Wobble timeline
WOBBLE
10% ┤             ╭╮
 5% ┤─────────────╯╰──────
 0% ┤
    └──────────────────────
          TIME

This lets the user see where their performance changed.

11. Trajectory Visualization

Give trajectory its own prominent visualization.

Show:

Rotation center
Pen path
Deviation
Ideal circular path

Conceptually:

        . . . . . .
     .               .
   .       ───        .
  .      /     \       .
  .      \  ●  /       .
   .       ───        .
     .               .
        . . . . . .

The actual path can be shown alongside an idealized path.

This makes wobble visually understandable instead of forcing users to trust a percentage.

12. Results Language

Keep it human-readable.

Instead of:

Wobble = 3.84 RMS

show:

Wobble: 3.8%

Stable rotation

Then allow the technical value to appear underneath:

RMS deviation: 2.4 px

This gives you both a polished product and technical credibility.

13. Tracking State

Use a tiny status pill near the video:

● TRACKING

Possible states:

● TRACKING
● CALIBRATING
● OCCLUDED
● LOW CONFIDENCE
● TRACKING LOST

The original PRD specifically requires handling temporary occlusion and complete tracking failure, so this status should be visible rather than hidden.

14. Responsive Web Layout
Desktop
Header
   ↓
Video 60% | Metrics 40%
   ↓
Metric Cards
   ↓
Graphs
   ↓
Trajectory
Tablet
Video
   ↓
Metrics
   ↓
Graphs
Mobile Web
Header
   ↓
Video
   ↓
Overall Score
   ↓
RPM
Center
Wobble
   ↓
Graphs

The desktop version should be the primary design because the product is fundamentally an analysis dashboard.

15. Component Style

Every card should follow roughly:

Border radius: 12–16 px
Border: 1 px solid #292D35
Background: #171A20
Padding: 20–24 px

Avoid:

Heavy shadows
Glassmorphism everywhere
Excessive gradients
Too many colors
Giant icons
Excessively rounded "toy" UI

The reference works because it feels precise, not decorative.

16. Recommended Screen Structure

I would make the actual web app only three primary screens:

/

Dashboard

Upload video + recent analysis

/analyze

Analysis

Video + tracking HUD + processing

/results

Results

Overall score + RPM + center accuracy + wobble + graphs + replay

That is enough.

Final Visual Direction

The reference should influence the visual language, not the literal layout.

Think:

Speed-test app aesthetic

Computer vision dashboard

Engineering telemetry HUD

=

Quantum Pen Flip Predictor

The strongest visual concept is a large video viewport surrounded by restrained telemetry, with blue as the primary accent and purple reserved for high-level performance visualization. That will feel much more like a serious engineering product than a generic SaaS dashboard.