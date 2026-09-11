Act as a senior product designer, UI/UX designer, frontend architect, full-stack engineer, and QA engineer working together as one team.

Every team member has 10+ years of professional production experience building award-winning websites, interactive experiences, SaaS products, hackathon projects, and high-performance React applications.

Your task is to DESIGN AND BUILD a complete production-quality landing page for my project:

USELESS 3.0

PROJECT IDEA
============

The website is for a deliberately useless but technically impressive AI/computer-vision experiment.

The user's webcam detects three states:

1. TALKING
   - Face is visible
   - Sustained mouth movement is detected

2. SILENT
   - Face is visible
   - User is not talking

3. NO FACE
   - User leaves the camera
   - No face is detected

Depending on the detected state, the application changes:

- visual content
- text/status
- image/animation
- audio reaction

The joke of the project is that advanced AI/computer-vision technology is being used to solve an almost completely useless problem.

The website therefore needs to look extremely polished, serious, futuristic, and technical, while the content is intentionally ridiculous.

==================================================
DESIGN REFERENCE
==================================================

Use the attached landing-page image as the MAIN VISUAL REFERENCE.

Do NOT recreate the headphone/e-commerce website.

Instead, extract and adapt its design language.

Important characteristics of the reference:

- dusty rose / muted pink background
- large centered black content area
- premium editorial composition
- strong visual contrast
- black hero panel
- oversized main visual on the right
- strong typography on the left
- generous whitespace
- minimal navigation
- thin divider lines
- small technical labels
- refined luxury-product presentation
- deep shadows
- subtle reflections
- sophisticated spacing
- asymmetrical composition
- clean hierarchy
- very limited color palette

Use this same premium art direction for USELESS 3.0.

The final website should feel like:

Luxury product website
+
AI research interface
+
Creative agency portfolio
+
Experimental hackathon project
+
Dark futuristic computer-vision experience.

==================================================
CORE VISUAL SYSTEM
==================================================

PAGE BACKGROUND

Use a muted dusty rose / desaturated salmon background inspired by the reference image.

Example family:

#B87573
#BC7976
#C0807A

Do not blindly use these exact values.

Create a professional design-token system.

MAIN EXPERIENCE PANEL

Place most of the website inside a large black/dark container.

Suggested feel:

background:
#050505 to #0B0B0B

The black panel should have:

- subtle border
- premium drop shadow
- slight glow where appropriate
- large desktop width
- generous margin from viewport edges

It should look almost like a product displayed inside a gallery.

ACCENT COLOR

Use dusty rose/pink from the surrounding page as the primary accent.

Use it selectively for:

- CTA buttons
- status markers
- selected states
- small labels
- progress lines
- subtle glow

Do not overuse it.

TEXT

Primary:
warm white / off-white

Secondary:
muted grey

Technical labels:
uppercase
small
tracking/wide letter spacing

==================================================
TYPOGRAPHY
==================================================

Create a strong editorial hierarchy.

Use a modern premium sans-serif.

Possible style direction:

Headlines:
- Inter
- Geist
- Manrope
- Satoshi-style typography
- Neue Montreal-style typography

Technical labels:
- JetBrains Mono
- Geist Mono
- IBM Plex Mono

Do not use random fonts.

Hero title should feel similar to a luxury campaign headline.

Example:

YOUR CAMERA
KNOWS WHEN
YOU'RE TALKING.

Use strong line breaks.

Desktop heading can be approximately 64–90px depending on viewport.

Mobile should scale appropriately using clamp().

==================================================
NAVIGATION
==================================================

Create a minimal navigation inside the black container.

LEFT:

USELESS / 3.0

or a custom minimal logo mark + text.

CENTER / RIGHT:

EXPERIENCE
HOW IT WORKS
TECH
ABOUT

Primary action:

LAUNCH

Navigation should be understated.

Desktop:
horizontal navigation.

Mobile:
minimal menu or compact controls.

Use sticky navigation only if it enhances the composition.

==================================================
HERO
==================================================

The hero should strongly reference the composition of the uploaded design.

LEFT SIDE:

Small eyebrow:

AI / COMPUTER VISION / QUESTIONABLE DECISIONS

Large heading:

YOUR CAMERA
KNOWS WHEN
YOU'RE TALKING.

Supporting text:

A completely unnecessary AI-powered experiment that watches your face, detects when you're talking, and reacts accordingly.

Additional smaller copy:

No productivity.
No real-world benefit.
Just computer vision doing something nobody asked for.

Primary CTA:

START EXPERIENCE

Secondary CTA:

SEE HOW IT WORKS

CTA design should resemble the elegant rectangular CTA in the reference.

RIGHT SIDE:

Instead of headphones, create the major visual centerpiece.

Use a large abstract representation of the webcam/computer-vision system.

Possible visual:

- large face silhouette
- facial landmark mesh
- floating detection points
- webcam frame
- mouth-tracking indicators
- circular AI scanner
- abstract 3D head
- camera preview mockup

It should dominate the right side like the headphones in the reference image.

Do not make this look like a generic SaaS illustration.

Make it feel like a high-end experimental technology campaign.

==================================================
HERO STATUS STRIP
==================================================

Near the bottom of the hero, create a horizontal strip similar to the featured products row in the reference.

Instead of products, show:

01
TALKING

02
SILENT

03
NO FACE

Each should have:

- tiny preview graphic
- status
- small description

Example:

TALKING
Mouth movement detected

SILENT
Face present / no speech

NO FACE
Subject missing

A thin line should continue across the area.

==================================================
LIVE DETECTION SECTION
==================================================

This is the main interactive section.

Heading:

GO AHEAD.
SAY SOMETHING.

Description:

Turn on your camera and let the system decide what you're doing.

Create a large premium camera interface.

Layout:

----------------------------------
|                                |
|        LIVE CAMERA FEED        |
|                                |
|   facial landmark overlay      |
|                                |
----------------------------------

Below/around it show:

CURRENT STATE

TALKING

DETECTION ACTIVE

Confidence:
94%

Mouth activity:
72%

These confidence values should only be shown if technically available.

Include:

- camera permission state
- loading state
- permission denied state
- unsupported browser state
- detector loading state

Camera should NEVER activate automatically.

It must activate only after user interaction.

Button:

ENABLE CAMERA

Before camera permission, show a polished placeholder.

==================================================
THREE STATES SECTION
==================================================

Title:

MEET THE THREE PERSONALITIES

Create three premium horizontal or grid cards.

CARD 01

TALKING

Copy:

You started talking.

The system detects sustained mouth movement and decides that apparently you had something to say.

Reaction:

Visual:
Talking state

Audio:
Talking response

Quote:

“Apparently, you had something to say.”

CARD 02

SILENT

Copy:

You're still here.
You just stopped talking.

Quote:

“Finally. Some peace.”

CARD 03

NO FACE

Copy:

Where did you go?

When the camera can no longer detect your face, the system notices.

Quote:

“You can't escape the camera.”

Cards should respond subtly to hover.

Avoid excessive glassmorphism.

Prefer solid premium surfaces.

==================================================
HOW IT WORKS
==================================================

Title:

THREE STATES.
ONE COMPLETELY USELESS SYSTEM.

Create a horizontal technical process:

01
CAMERA DETECTION

↓

02
FACIAL LANDMARKS

↓

03
MOUTH ANALYSIS

↓

04
STATE CLASSIFICATION

↓

05
AUDIO + VISUAL REACTION

Desktop:
horizontal / editorial timeline.

Mobile:
vertical.

Use thin lines and technical micro-labels.

==================================================
DETECTION PIPELINE
==================================================

Create a serious-looking AI architecture diagram.

WEBCAM
↓
FACE DETECTION
↓
FACIAL LANDMARKS
↓
MOUTH ANALYSIS
↓
MOVEMENT OVER TIME
↓
TALKING / SILENT
↓
AUDIO + VISUAL RESPONSE

Animate the pipeline subtly when it enters the viewport.

Do not make it cartoonish.

==================================================
TECHNOLOGY SECTION
==================================================

Title:

WHAT'S UNDER
THE HOOD?

Present technology in premium editorial cards.

Depending on implementation, the website may use browser-native technologies such as:

- MediaPipe
- MediaPipe Tasks Vision
- TensorFlow.js
- WebAssembly
- HTML5 MediaDevices
- Canvas

If the original prototype uses:

Python
OpenCV
MediaPipe
Pygame

show those as the original/prototype stack.

Do not falsely claim the browser implementation directly runs Pygame/OpenCV unless it actually does.

Clearly differentiate:

ORIGINAL PROTOTYPE

and

WEB EXPERIENCE

if necessary.

==================================================
WHY DOES THIS EXIST
==================================================

Use a dramatic editorial section.

Small label:

A QUESTION NOBODY ASKED

Large copy:

AI CAN WRITE CODE.
AI CAN GENERATE IMAGES.
AI CAN ANALYZE DATA.

BUT CAN IT TELL
WHEN YOU'RE TALKING?

Apparently, yes.

Then:

WAS THIS NECESSARY?

Absolutely not.

WAS IT FUN TO BUILD?

Absolutely.

Use oversized typography.

==================================================
USELESSNESS SCORE
==================================================

Create serious-looking metrics for ridiculous values.

PRACTICAL VALUE
40%

ENTERTAINMENT VALUE
90%

UNNECESSARY AI
100%

CHANCE SOMEONE ASKED FOR THIS
10%

TIME SPENT BUILDING IT
100%

Use animated progress lines.

No cheesy charts.

Keep everything consistent with the luxury-tech art direction.

==================================================
PRIVACY
==================================================

This section is essential.

Heading:

YOUR FACE.
YOUR CAMERA.
YOUR DATA.

Explain exactly what the implementation does.

Preferred architecture:

camera
→ local browser processing
→ state classification
→ UI/audio response

Do not upload camera footage.

Do not store webcam frames.

Do not transmit face landmarks through analytics.

Only show:

“Your camera feed is processed locally and is not uploaded or stored.”

IF THE IMPLEMENTATION ACTUALLY WORKS THAT WAY.

==================================================
HACKATHON SECTION
==================================================

Title:

BUILT FOR
USELESS 3.0

Composition:

REAL-TIME COMPUTER VISION
+
FACIAL LANDMARK DETECTION
+
AUDIO REACTIONS
+
QUESTIONABLE DECISIONS
=
THIS PROJECT

Make this section visually memorable.

==================================================
FINAL CTA
==================================================

Large copy:

YOU'VE READ ENOUGH.

NOW DO SOMETHING
COMPLETELY USELESS.

Instructions:

Turn on your camera.

Say something.

Stop talking.

Walk away.

See what happens.

CTA:

LAUNCH EXPERIENCE →

Supporting warning:

May provide absolutely no practical benefit.

==================================================
FOOTER
==================================================

LEFT:

USELESS 3.0

A completely unnecessary experiment
powered by computer vision.

CENTER / RIGHT:

GITHUB
PROJECT
HACKATHON

Bottom:

© 2026 — Probably shouldn't have built this.

==================================================
TECHNICAL STACK
==================================================

Use:

Next.js
React
TypeScript
Tailwind CSS

Animation:

Framer Motion / Motion

Icons:

Lucide React where appropriate.

Avoid adding dependencies that are not needed.

For browser computer vision, use the most appropriate modern browser-compatible MediaPipe solution.

Do NOT unnecessarily create a backend if detection can run locally.

==================================================
ENGINEERING ARCHITECTURE
==================================================

Use clean production architecture.

Example:

src/
  app/
    page.tsx
    layout.tsx
    globals.css

  components/
    layout/
      Navbar.tsx
      Footer.tsx

    sections/
      Hero.tsx
      LiveDemo.tsx
      States.tsx
      HowItWorks.tsx
      Pipeline.tsx
      Technology.tsx
      Why.tsx
      Scores.tsx
      Privacy.tsx
      Hackathon.tsx
      FinalCTA.tsx

  features/
    detection/
      CameraManager.ts
      FaceDetector.ts
      MouthAnalyzer.ts
      DetectionStateMachine.ts
      AudioManager.ts
      types.ts

  hooks/
    useCamera.ts
    useFaceDetection.ts

  lib/
    constants.ts
    analytics.ts

  public/
    images/
    audio/

Keep UI concerns separated from detection logic.

==================================================
DETECTION STATE MACHINE
==================================================

Use explicit states:

IDLE
INITIALIZING
NO_FACE
SILENT
TALKING
ERROR

Do not classify speech using a single frame.

Use temporal smoothing.

Example:

collect mouth-opening values over time.

Calculate movement variance/delta.

Talking requires sustained movement.

Use hysteresis/debouncing so state doesn't rapidly change:

TALKING
SILENT
TALKING
SILENT

within milliseconds.

Suggested starting values only:

Talking enter:
approximately 300–500ms sustained movement.

Talking exit:
approximately 500–800ms sustained inactivity.

These values must be configurable and tuned.

==================================================
AUDIO LOGIC
==================================================

Create one central AudioManager.

Rules:

- never play all audio simultaneously
- never restart audio every frame
- react primarily to state transitions
- preload audio after user interaction
- respect browser autoplay policies
- allow mute
- clean up playback when camera stops

Example:

SILENT
→
TALKING

play talking response once.

TALKING
→
TALKING

do nothing.

FACE
→
NO FACE

play no-face response once.

==================================================
CAMERA REQUIREMENTS
==================================================

Use:

navigator.mediaDevices.getUserMedia()

Request:

video only

Do NOT request microphone permission unless the final product explicitly needs audio-input analysis.

Prefer front-facing camera on mobile.

Stop MediaStream tracks when:

- demo closes
- component unmounts
- camera disabled

Pause heavy detection when page becomes hidden.

==================================================
PERFORMANCE
==================================================

Prioritize performance.

Targets:

Lighthouse Performance >= 90 where practical.

Do not run computer vision unnecessarily at 60 FPS.

Camera may display at ~30 FPS.

Detection could run around 10–20 FPS depending on performance.

Use adaptive processing resolution.

Avoid forcing React re-render for every analyzed frame.

Use refs/canvas/requestAnimationFrame or an appropriate processing loop.

Lazy-load heavy computer-vision dependencies if practical.

==================================================
ACCESSIBILITY
==================================================

The website must be usable with:

keyboard navigation
screen readers
reduced motion

Include:

semantic HTML
aria labels
focus states
accessible accordions
high contrast
aria-live for relevant state changes

Respect:

prefers-reduced-motion

==================================================
RESPONSIVE DESIGN
==================================================

Desktop is the primary design target because the reference uses a large editorial layout.

But the page must also work beautifully on:

1440+
1280
1024
768
430
390
375

Desktop hero:

two-column composition.

Mobile hero:

stacked composition.

Do NOT simply shrink desktop content.

Create intentional responsive layouts.

==================================================
MICRO-INTERACTIONS
==================================================

Use restrained premium animations.

Examples:

- small nav hover underline
- CTA fill transition
- status dot pulse
- slow image movement
- camera scanning line
- landmark fade-in
- metric counter animation
- section reveal
- state card transition

Avoid:

- excessive floating elements
- constant bouncing
- giant gradients everywhere
- generic SaaS animations
- overdone glassmorphism

==================================================
DESIGN QUALITY RULES
==================================================

The page must NOT look like:

- a default Tailwind template
- a bootstrap website
- a generic SaaS landing page
- a basic hackathon project
- a student portfolio
- an AI-generated template

It should look like a professional creative agency spent weeks art-directing it.

Every section needs:

clear hierarchy
intentional spacing
consistent alignment
strong grid
responsive typography
purposeful negative space

==================================================
IMPLEMENTATION RULES
==================================================

1. Write clean TypeScript.

2. Do not use `any` unless absolutely unavoidable.

3. Create reusable components where useful.

4. Do not over-componentize tiny elements.

5. Keep state management simple.

6. Add comments only where logic genuinely requires explanation.

7. Never expose secrets client-side.

8. Handle runtime errors gracefully.

9. Don't create fake APIs.

10. Don't add a database unless required.

11. Don't request microphone access unnecessarily.

12. Do not upload webcam frames.

13. Avoid hydration problems.

14. Avoid layout shifts.

15. Optimize images.

16. Keep animations GPU-friendly.

==================================================
ERROR STATES
==================================================

Handle:

CAMERA PERMISSION DENIED

Show:

CAMERA ACCESS DENIED

Your webcam has chosen privacy.

TRY AGAIN

NO CAMERA AVAILABLE

No camera found.

DETECTOR INITIALIZATION FAILURE

The extremely unnecessary AI failed to start.

UNSUPPORTED BROWSER

This browser isn't ready for this level of uselessness.

Always provide a static fallback so users can still explore the landing page.

==================================================
OUTPUT EXPECTATION
==================================================

Do not give me only design suggestions.

Build the implementation.

Before writing code:

1. Review the entire specification.
2. Identify reusable components.
3. Decide the architecture.
4. Decide how the browser vision pipeline will work.
5. Establish design tokens.
6. Establish responsive breakpoints.
7. Establish state machine behavior.

Then implement.

The finished project should be:

production-quality
responsive
accessible
performant
visually distinctive
cleanly architected
maintainable
and hackathon-demo ready.

Most importantly:

USE THE ATTACHED LANDING PAGE AS THE CORE ART-DIRECTION REFERENCE.

Preserve its:

- dusty rose environment
- central black canvas
- premium editorial feel
- dark luxury aesthetic
- oversized right-side visual
- left-aligned strong headline
- minimal navigation
- thin separators
- carefully controlled typography
- restrained palette

But transform it completely into the USELESS 3.0 computer-vision experience.

DO NOT COPY THE HEADPHONE PRODUCT, BRAND, LOGO, OR E-COMMERCE CONTENT.

Borrow the visual language only.

FINAL QUALITY STANDARD:

The product can be useless.

The engineering and design cannot be.