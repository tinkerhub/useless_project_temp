# Moodi — Design Specification

## 1. Purpose

Moodi is a mood-based AI virtual pet chatbot. It should feel like a living digital creature rather than a conventional AI assistant with a mascot added on top.

The core experience is:

> User sends a message → AI interprets the user's tone → Moodi's mood changes → the avatar reacts → the entire environment transforms → Moodi responds in its new personality.

The primary success criterion is that a viewer thinks:

**"I've never seen a chatbot behave like this."**

The design must support the existing project context and remain realistic for a React frontend built by two people within an approximately 18-hour build window.

---

## 2. Design Priorities

Follow this priority order:

1. Robustness
2. Visual polish
3. Expressive avatar
4. Mood/environment transitions
5. Chat usability
6. Extra features

Do not add features at the cost of stability.

Avoid turning the project into a generic SaaS dashboard or conventional AI chat application.

---

## 3. Product Identity

### Temporary product name

**Moodi**

The name is intentionally replaceable later.

### Logo

Create a simple playful wordmark that can be replaced easily.

Possible visual language:

- rounded typography
- tiny paw, sparkle, or face motif
- cute but not childish
- minimal rather than corporate

The logo should remain secondary to the avatar.

---

## 4. Art Direction

### Overall style

Use a:

**Detailed illustrated + very cute chibi + expressive digital creature aesthetic**

The design should feel:

- cute
- polished
- quirky
- emotionally expressive
- friendly
- memorable
- slightly unusual

Avoid:

- generic AI robots
- generic emoji mascots
- plain geometric blobs
- realistic animals
- corporate SaaS illustration
- preschool-style graphics
- excessive visual clutter
- photorealism
- complex 3D rendering

Use a polished 2D illustrated aesthetic with enough detail to feel intentionally designed.

The illustration should remain practical to reproduce using layered SVG/illustration assets and CSS/React animation.

---

# 5. Mascot Specification

## Base character

Moodi is a hybrid:

**Chibi bunny-cat**

Base characteristics:

- round fluffy body
- oversized head
- short tiny paws
- large expressive ears
- rounded silhouette
- tiny tail
- large expressive eyes
- small mouth
- soft cheeks

Base body color:

`#BCE7FD`

Use clean light/white outlines and subtle shading.

## Character consistency

There must be ONE recognizable mascot.

Do not design six unrelated characters.

Instead, design six states of the same character.

The following should be independently changeable:

- eyes
- eyebrows
- mouth
- ears
- cheeks
- body posture
- fur silhouette
- accessories/details
- particles
- lighting

This makes the avatar practical to implement as a reusable React/SVG component.

---

# 6. Application Composition

The application should be centered around the creature.

### Desktop

Recommended hierarchy:

1. Small Moodi logo
2. Current emotional environment
3. Large/medium mascot
4. Pet conversation bubbles
5. User messages
6. Chat input
7. Minimal secondary controls

Do not use a heavy sidebar unless absolutely necessary.

The interface should not look like ChatGPT.

The mascot should occupy the strongest visual position.

### Mobile

Recompose the layout rather than simply shrinking desktop.

Recommended order:

1. Branding
2. Mood/environment
3. Medium-sized mascot
4. Conversation
5. Input fixed/anchored near the bottom

The avatar must remain large enough for its facial expression to be understood.

---

# 7. Landing State

Use a very short landing experience.

It should feel like entering Moodi's little world rather than visiting a marketing website.

Suggested content:

**Meet Moodi.**

**You never know what mood you'll get.**

Then transition directly into the chat.

Do not require mood selection.

The initial mood must be randomly generated.

---

# 8. Mood System

There are exactly six baseline moods:

- Angry
- Shy
- Sleepy
- Excited
- Dramatic
- Sad

There is no neutral state.

Mood affects:

- background
- avatar
- animation
- particles
- chat bubbles
- writing personality
- overall atmosphere

Do not use a permanent intensity meter as the primary visual indicator.

Mood should instead be communicated through the creature and the environment.

---

# 9. Mood: Angry

### Color

`#FF4B4B`

### Environment

- coral-red background
- energetic gradient
- subtle tension
- small moving particles
- darker accents

### Avatar

- jagged/fluffed silhouette
- tense ears
- scowling eyes
- clenched zig-zag teeth
- angry eyebrows
- steam venting from ears

### Animation

- rapid horizontal shaking
- small tremor
- steam puffs
- subtle environmental vibration

### Chat appearance

Pet messages should feel sharp and impatient.

Possible visual treatment:

- slightly sharper bubble shape
- stronger typography
- subtle shake on entrance

---

# 10. Mood: Shy

### Color

`#FAD2E1`

### Environment

- powder blush pink
- soft glow
- subtle sparkles
- gentle floating particles

### Avatar

- curled into a small ball
- paws covering mouth
- huge teary eyes looking sideways
- heavy crimson cheek blush
- ears partly folded inward

### Animation

- breathing scale pulse
- nervous micro-movement
- occasional sideways eye movement
- faint sparkles

### Chat appearance

Pet messages should look softer and smaller.

Use gentle rounded speech bubbles.

---

# 11. Mood: Sleepy

### Color

`#1E1B4B`

### Environment

- deep midnight blue/purple
- dark gradient
- dim atmosphere
- tiny stars

### Avatar

- flattened puddle-like body
- limp ears
- slit eyes
- small drool/snot bubble
- relaxed expression

### Animation

- slow breathing
- slow blinking
- tiny head movement
- drifting `Zzz`
- occasional yawn

### Chat appearance

Pet messages should feel slow and unfinished.

Use subtle fade/slow entrance animations.

---

# 12. Mood: Excited

### Color

`#FFD166`

### Environment

- bright sunflower yellow
- energetic gradient
- colorful confetti
- stars
- playful motion

### Avatar

- airborne jumping pose
- ears straight up
- huge open smile
- wide eyes
- star/glowing pupils
- paws raised

### Animation

- continuous bounce
- occasional larger jump
- confetti bursts
- stars
- squash-and-stretch

### Chat appearance

Pet messages should bounce into the conversation.

Use energetic typography and playful entrance motion.

The environment can occasionally introduce a shiny visual distraction to reinforce the personality.

---

# 13. Mood: Dramatic

### Color

`#5A189A`

### Environment

- theatrical royal purple
- top-center spotlight
- dark vignette
- stage-like atmosphere

### Avatar

- theatrical backward swoon
- drooping ears
- asymmetrical glistening eyes
- trembling mouth
- raised paw
- exaggerated tragic expression

### Animation

- spotlight pulse/movement
- subtle trembling
- slow dramatic head movement
- occasional swoon

### Chat appearance

Pet messages should feel theatrical.

Use subtle vignette treatment and slower reveals.

IMPORTANT:

Dramatic must not look like Excited.

Excited = positive chaotic energy.

Dramatic = negative theatrical burden.

---

# 14. Mood: Sad

### Color

`#4A6B82`

### Environment

- muted slate blue
- desaturated atmosphere
- rain cloud
- falling rain
- soft fog/cloud feeling

### Avatar

- deflated body
- ears pooling beside body
- huge watery reflective eyes
- wavy frown
- body pressed close to ground

### Animation

- slow breathing
- slight downward movement
- animated rain cloud
- falling raindrops
- occasional tiny sniffle movement

### Chat appearance

Pet messages should enter gently.

Incoming user messages may become slightly desaturated.

---

# 15. Mood Transition System

Mood transitions are a major visual feature.

Do not instantly replace the mood color.

Use a coordinated transition lasting approximately 0.5–1 second.

Transition sequence:

1. Current avatar reacts
2. Current expression briefly exaggerates
3. Eyes/mouth/ears morph
4. Body posture changes
5. Old particles fade
6. Background gradient transitions
7. New environment appears
8. New mood particles appear
9. New idle animation begins

The transition should be clearly visible during a live demo.

Example:

### Sad → Excited

- rain fades
- avatar lifts itself
- ears rise
- eyes widen
- body jumps
- yellow atmosphere expands
- stars/confetti appear
- chat becomes energetic

This is one of the project's primary "wow" moments.

---

# 16. Avatar Animation System

The mascot must never feel like a static image.

Implement reusable idle animation states:

### Angry
Shake + steam

### Shy
Breathing + sparkle + nervous movement

### Sleepy
Blink + yawn + Zzz + breathing

### Excited
Bounce + confetti + squash/stretch

### Dramatic
Swoon + trembling + spotlight

### Sad
Droop + rain + slow breathing

Animations should preferably use lightweight:

- CSS transforms
- opacity
- SVG/layer changes
- React state
- simple particle elements

Avoid WebGL or complicated physics.

---

# 17. Chat Design

Use a speech-bubble conversation style.

## Pet messages

Pet messages should feel like they originate from the creature.

Use:

- organic rounded bubbles
- small bubble tail pointing toward mascot
- mood-specific micro-effects
- expressive entrance animation

## User messages

User messages should be:

- simpler
- clean
- visually distinct
- secondary to the pet

Do not make the user side visually compete with the mascot.

---

# 18. Mood-Specific Message Effects

### Angry
Bubble slightly shakes.

### Shy
Bubble appears small and softly fades in.

### Sleepy
Bubble slowly fades in with subtle Zzz particles.

### Excited
Bubble pops/bounces into place.

### Dramatic
Bubble reveals slowly with subtle vignette.

### Sad
Bubble gently fades in with soft atmospheric rain.

Effects must never reduce text readability.

---

# 19. Chat Input

Use a large rounded input.

Placeholder:

**Talk to Moodi…**

Include:

- text input
- send button
- clear visual affordance
- comfortable touch target

When a request is in flight:

- disable sending
- show a pet-specific thinking state
- prevent repeated submissions

---

# 20. Thinking State

Do not use only a generic loading spinner.

Instead, make the pet appear to think:

- eyes move
- tiny thought particles
- subtle head movement
- animated ellipsis
- temporary thinking expression

The user should feel like the pet is processing the question.

---

# 21. Error / API Limit State

The error state should feel like a personality event.

If the API fails or reaches its limit:

Moodi visually conks out.

Suggested copy:

**brain.exe stopped responding…**

Secondary:

**Give me a sec.**

Visual state:

- sleepy/dazed pose
- drooping body
- glitch effect
- confused eyes
- tiny Zzz particles
- slightly dimmed environment

This state must be prebuilt in the frontend and must not require another API call.

---

# 22. Mood Indicator

Do not use a large conventional status dashboard.

Use an interactive, lightweight mood indicator near the mascot.

The avatar itself is the main indicator.

Optional:

- tiny mood name
- tiny icon/badge
- hover/tap interaction showing the mood reason

Do not display a persistent 0–100 intensity bar unless it can be integrated without weakening the visual design.

---

# 23. Responsive Behavior

### Desktop

- medium-to-large mascot
- generous emotional environment
- larger conversation area
- visible particles
- dramatic transitions

### Mobile

- medium mascot
- compact but expressive environment
- conversation remains easy to read
- input remains accessible
- effects scale down but do not disappear

The design must preserve the mood experience on both platforms.

---

# 24. Accessibility

Maintain:

- readable typography
- sufficient contrast
- clear input controls
- readable speech bubbles
- animation that does not block content

The visual effects are important, but the chatbot must remain usable.

---

# 25. Technical Design Constraints

Target:

**React web application**

Use implementation-friendly techniques:

- React state
- SVG/layered avatar
- CSS transitions
- CSS keyframe animations
- lightweight particles
- reusable components
- responsive CSS

Avoid:

- WebGL
- 3D engines
- complicated physics
- video backgrounds
- huge image assets
- unnecessarily complex animation pipelines

The visual system should be possible for a two-person team to integrate quickly.

---

# 26. Suggested Component Structure

Design the UI so it can naturally map to components such as:

```text
App
├── LandingScreen
├── MoodEnvironment
├── MoodiAvatar
│   ├── Eyes
│   ├── Mouth
│   ├── Ears
│   ├── Body
│   └── MoodEffects
├── ChatWindow
│   ├── PetMessage
│   └── UserMessage
├── ThinkingState
├── ChatInput
└── ErrorState
```

The exact component structure may be changed during implementation, but the design should support this separation.

---

# 27. Developer Demo Control

Keep developer controls hidden.

Use a keyboard shortcut or hidden interaction to force a specific mood during a presentation.

Do not expose a developer mood selector in the normal interface.

The normal user should experience the mood system naturally.

---

# 28. Demo Scenario

The ideal demo should communicate the entire concept quickly.

Example:

1. Open Moodi
2. A random mood appears
3. User sends a normal question
4. Moodi responds in-character
5. Mood changes based on user tone
6. Entire background transforms
7. Avatar morphs
8. Particles change
9. Chat bubble style changes
10. Moodi's personality changes

The mood transformation should be impossible to miss.

---

# 29. Visual Success Criteria

The final UI should satisfy these statements:

- It does not look like a normal AI chatbot.
- The mascot is immediately recognizable.
- The mascot is clearly alive.
- Each mood is visually distinct.
- The entire page changes with mood.
- Mood transitions are dramatic.
- Pet messages feel connected to the character.
- The interface remains readable.
- The design works on desktop and mobile.
- The design is realistic to implement in React.
- The project feels memorable rather than feature-heavy.

Most importantly:

**The design should make people curious about what Moodi will do next.**

The emotional unpredictability is the product.
