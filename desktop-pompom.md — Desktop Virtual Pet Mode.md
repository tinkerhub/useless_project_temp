# MoodPet — Desktop Pompom / Virtual Pet Mode

## 1. Purpose

Add a new **Desktop Virtual Pet Mode** to the existing MoodPet application.

The goal is to make Pompom feel like a small living creature that exists outside the chatbot.

Instead of Pompom only existing inside the MoodPet web application, the user should be able to activate a small Pompom companion that:

- appears on top of the desktop
- stays visible while the user uses other applications
- can sit, walk, bounce, fall, sleep, react, and interact
- reflects Pompom's current mood
- occasionally performs autonomous actions
- can be clicked/interacted with
- can return to the main MoodPet chatbot

The experience should feel like a **small virtual pet living on the user's desktop**.

---

# 2. CRITICAL REQUIREMENT

The existing MoodPet web application is already working.

**DO NOT rebuild the existing application.**

Do not remove or replace:

- existing chatbot
- Gemini integration
- mood system
- Pompom character
- conversation history
- existing UI
- existing animations
- existing developer controls
- existing voice system

Desktop Pet Mode must be implemented as an additional capability.

Reuse existing Pompom assets, mood definitions, colors, animations, and state wherever possible.

---

# 3. Platform Goal

The desktop pet must be able to appear **outside the browser window**.

A normal webpage cannot reliably stay above other applications.

Therefore, if the current architecture permits it, create a lightweight desktop wrapper using:

**Electron**

Preferred conceptual architecture:

```text
                 MoodPet Application
                        │
             ┌──────────┴──────────┐
             │                     │
        Main Chat UI          Desktop Pet
             │                     │
          React UI              Electron
                                   │
                            Transparent Window
                                   │
                              Desktop Overlay
```

The desktop pet should be a transparent, frameless, always-on-top Electron window.

Do not introduce unnecessary backend infrastructure.

---

# 4. Desktop Window Requirements

The Pompom desktop window should:

- have a transparent background
- have no visible OS window border
- have no traditional title bar
- stay above normal applications
- have a small initial size
- be resizable/configurable internally
- allow Pompom to move around within the screen
- remember its current position during the current application session
- support multiple monitor setups where reasonably possible

The window itself should not look like a window.

The user should see only Pompom.

---

# 5. Pompom Appearance

Pompom should appear as a small character rather than a large application window.

Default approximate size:

```text
Width: 120–220 px
Height: 120–220 px
```

The exact size should depend on the existing Pompom design.

The character must have enough empty/transparent space around it to make the movement feel natural.

Avoid putting a rectangular background behind Pompom.

---

# 6. Desktop Position

Initial position:

**Bottom-right area of the primary screen.**

Example:

```text
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│                                             │
│                                      🐾     │
│                                  Pompom     │
└─────────────────────────────────────────────┘
```

However, Pompom should not be permanently stuck there.

It should occasionally move around the available desktop edges.

---

# 7. Desktop Movement

Pompom should have simple autonomous movement.

Possible behaviors:

### Walk

Pompom walks slowly across the bottom of the screen.

### Sit

Pompom stops and sits.

### Idle

Pompom stays still but performs a small idle animation.

### Look around

Pompom looks left/right.

### Bounce

Pompom performs a small excited bounce.

### Sleep

Pompom lies down or closes its eyes.

### Fall

Pompom can occasionally fall from the top/side into position.

### Wake

Pompom gets up after sleeping.

### Turn

Pompom changes direction when reaching an edge.

---

# 8. Movement Style

Movement should feel like a small physical creature.

Avoid:

- robotic movement
- constant walking
- perfectly linear movement
- excessive speed
- constant bouncing

Use:

- small pauses
- easing
- acceleration/deceleration
- idle periods
- random movement intervals

Pompom should feel alive rather than like a screensaver.

---

# 9. Desktop Physics

Implement lightweight fake physics where useful.

For example, when Pompom falls:

```text
      🐾
       ↓
       ↓
       ↓
      boop
    ─────────
```

The fall can include:

- gravity-like acceleration
- small squash/stretch on landing
- bounce
- recovery animation

Do not implement a complicated physics engine.

Simple animation calculations are sufficient.

---

# 10. Mood Integration

Desktop Pompom must use the existing 10-mood system.

Valid moods:

```text
excited
sad
angry
dramatic
sleepy
shy
confused
toddler
overprotective
bargainer
```

The desktop pet should visually reflect its current mood.

---

# 11. Mood-Based Desktop Behavior

Mood should affect **behavior**, not just appearance.

### Excited

- runs/bounces more
- moves frequently
- jumps occasionally
- energetic idle animation
- bright particles

### Sad

- moves slowly
- sits more often
- droops
- occasionally looks toward the user
- may lie down

### Angry

- stomps
- moves sharply
- turns away
- shakes slightly
- short aggressive idle animation

### Dramatic

- exaggerated movements
- falls dramatically
- theatrical poses
- pauses before actions
- dramatic reactions

### Sleepy

- moves very little
- yawns
- lies down
- occasionally falls asleep
- slow idle animation

### Shy

- hides/turns away
- small movements
- looks away when clicked
- occasionally peeks back

### Confused

- walks in the wrong direction briefly
- stops
- question mark appears
- looks around
- head tilt
- slight wobble

### Toddler

- bounces
- wanders unpredictably
- gets distracted
- chases small visual particles
- sits down suddenly

### Overprotective Parent

- looks around alertly
- follows/approaches the user interaction area
- defensive stance
- shield/heart effect
- reacts strongly to unusual events

### Bargainer

- approaches the cursor
- extends paw
- waits
- coin/star particles
- playful "deal-making" animation

---

# 12. Autonomous Behavior

Pompom should have an autonomous behavior loop.

It should occasionally decide to do something without the user clicking it.

Possible actions:

```text
IDLE
WALK
SIT
LOOK_AROUND
BOUNCE
SLEEP
WAKE
FALL
REACT
PLAY
```

The behavior should be selected based on:

- current mood
- intensity
- time since last action
- random chance
- current interaction state

Do not make Pompom perform an action every second.

Idle time is important.

---

# 13. Controlled Randomness

Pompom should occasionally surprise the user.

Examples:

- suddenly walks across the screen
- falls from somewhere
- sits down
- yawns
- gets excited
- looks at the cursor
- turns around
- gets distracted
- performs a tiny dance
- falls asleep

Use controlled randomness.

The behavior should be:

**unpredictable but not annoying.**

Do not create constant movement.

---

# 14. Cursor Interaction

Pompom should respond to the mouse cursor.

Possible interactions:

### Hover

Pompom may:

- look at the cursor
- follow it with its eyes
- become curious
- move slightly

### Click

Pompom may:

- bounce
- react emotionally
- make a tiny animation
- change expression
- say a short phrase

### Multiple clicks

Avoid annoying behavior.

Pompom can eventually react:

> "HEY."

or:

> "stop poking me 😭"

The exact dialogue should be generated or selected according to the current mood.

---

# 15. Desktop Pet Dialogue

Do not make Pompom constantly talk.

Most desktop behavior should be visual.

Occasionally Pompom can display a tiny speech bubble.

Examples:

```text
"hello??"

"what are you doing"

"i'm bored"

"you've been staring at that screen for 3 hours"

"HEY LOOK AT ME"

"..."

"i saw that."
```

Dialogue must respect the current mood and Pompom character definition.

---

# 16. Speech Integration

If the existing voice system is available:

Pompom may occasionally speak its short desktop dialogue.

However:

**Do NOT make Pompom constantly produce voice.**

Automatic desktop speech should be rare.

The main chatbot remains the primary voice interaction.

Desktop pet speech should feel like an occasional surprise.

---

# 17. Chat Connection

The desktop pet should be connected to the existing MoodPet application.

Conceptually:

```text
Main MoodPet
      │
      ├── Current Mood
      ├── Intensity
      ├── Character State
      └── Session
             │
             ▼
       Desktop Pompom
```

When the chatbot mood changes:

```text
Gemini
  ↓
New Mood
  ↓
Mood State
  ↓
Desktop Pompom
  ↓
New animation / behavior
```

The desktop pet should therefore always feel like the same Pompom.

---

# 18. Shared State

Do not create a completely separate mood system for the desktop pet.

Use the existing mood/state architecture where possible.

The desktop pet should consume:

```text
mood
intensity
character state
```

and convert those values into:

```text
animation
movement
expression
particles
behavior
```

---

# 19. Opening the Main Chat

The desktop Pompom should provide a simple way to open the main MoodPet interface.

Possible behavior:

### Double-click Pompom

Open/focus the main MoodPet application.

OR:

### Context menu

Right-click:

```text
Talk to Pompom
Pause Pompom
Change Mood
Hide Pompom
Reset
Quit
```

Keep the menu minimal.

---

# 20. Pause Mode

Allow the user to temporarily pause the desktop pet.

When paused:

- Pompom stops autonomous movement.
- Pompom remains visible.
- Pompom can still be clicked if appropriate.
- No automatic speech occurs.

Provide a way to resume.

---

# 21. Hide Mode

Allow the user to hide Pompom without closing MoodPet.

For example:

```text
Hide Pompom
```

The main application should remain usable.

The user should be able to bring Pompom back.

---

# 22. Quit Behavior

Provide a way to completely close the desktop companion.

This should:

- close the desktop window
- stop autonomous timers
- stop speech
- clean up listeners
- terminate the Electron process if appropriate

Avoid background processes continuing after the user quits.

---

# 23. Desktop Pet Settings

Do not build a huge settings panel.

Only provide essential controls initially:

- Enable/disable desktop pet
- Pause/resume
- Size
- Position/reset position
- Sound/voice on/off
- Hide/show

If these controls are easier to expose through a small context menu, prefer that.

---

# 24. Performance

The desktop companion must be lightweight.

Do not:

- continuously call Gemini
- continuously generate AI responses
- constantly update React state
- use heavy rendering
- run unnecessary physics calculations
- continuously poll the backend

Autonomous movement should be local.

Gemini should only be called when an actual conversational interaction requires it.

---

# 25. No Continuous AI Calls

This is extremely important.

Pompom's autonomous movement must NOT mean:

```text
every 10 seconds → Gemini API
```

That would waste API quota.

Instead:

```text
Local behavior engine
        ↓
Random action
        ↓
Animation
```

Only actual conversational interactions should call Gemini.

---

# 26. Desktop Architecture

Preferred architecture:

```text
MoodPet/
│
├── existing React application
│
├── existing Node backend
│
└── desktop/
    ├── main process
    ├── preload
    ├── desktop pet window
    └── desktop behavior
```

Adapt this structure to the existing project.

Do not blindly create these exact folders if the current architecture suggests a better location.

---

# 27. Electron Security

Follow Electron security best practices.

Do NOT:

- enable unnecessary Node.js access in the renderer
- expose unrestricted IPC
- expose API keys
- put Gemini credentials in the desktop frontend
- disable security features unnecessarily

Use a preload layer for controlled communication between the renderer and Electron main process where required.

---

# 28. API Key Security

The desktop pet must NOT contain the Gemini API key.

The existing security model remains:

```text
Desktop / React
       ↓
Node Backend
       ↓
Gemini
```

Never:

```text
Desktop Pet
       ↓
Gemini directly
```

---

# 29. Existing Web Application

The original browser version must remain usable.

Users should still be able to run MoodPet as a normal web application.

Desktop Pet Mode is an optional enhancement.

Do not make Electron mandatory for the existing browser experience unless technically unavoidable.

---

# 30. First Version Scope

For the first implementation, prioritize:

### Must have

- transparent desktop window
- Pompom visible outside the browser
- always-on-top behavior
- drag/move Pompom
- basic walking
- idle animations
- mood-based animations
- click interaction
- autonomous random actions
- open main MoodPet on interaction
- hide/show
- pause/resume
- clean exit

### Nice to have

- falling animation
- simple fake physics
- cursor tracking
- speech bubbles
- occasional voice
- multi-monitor support
- persistent desktop position

Do not delay the working desktop pet because of optional features.

---

# 31. Avoid Overengineering

This feature is intended to make MoodPet more fun, not turn it into a full operating-system application.

Do NOT add:

- databases
- cloud synchronization
- user accounts
- complex physics engines
- AI agents
- continuous Gemini calls
- unnecessary external APIs
- complicated desktop services
- auto-start on OS boot unless explicitly requested later

Keep it lightweight.

---

# 32. Development Strategy

Implement incrementally.

### Step 1

Understand the existing MoodPet architecture.

### Step 2

Determine whether Electron can be integrated cleanly.

### Step 3

Create a minimal transparent desktop window.

### Step 4

Render the existing Pompom inside it.

### Step 5

Make the window draggable.

### Step 6

Add idle animation.

### Step 7

Add walking.

### Step 8

Connect existing mood state.

### Step 9

Add mood-specific desktop behavior.

### Step 10

Add autonomous behavior.

### Step 11

Add cursor/click interaction.

### Step 12

Add connection to the main chatbot.

### Step 13

Add optional speech/speech bubbles.

### Step 14

Test performance and stability.

---

# 33. Testing

Test the following:

### Window

- Pompom appears.
- Background is transparent.
- No unwanted borders.
- Pompom stays above other applications.
- Pompom can be moved.

### Movement

- Walk.
- Stop.
- Turn.
- Sit.
- Idle.
- Sleep.
- Wake.
- Fall if implemented.

### Mood

Test all 10 moods:

```text
Excited
Sad
Angry
Dramatic
Sleepy
Shy
Confused
Toddler
Overprotective
Bargainer
```

Each should visibly behave differently.

### Interaction

- Click.
- Hover.
- Drag.
- Open main chat.
- Hide.
- Pause.
- Resume.
- Quit.

### Stability

- Close/reopen.
- Run for an extended period.
- Use another application while Pompom is active.
- Verify no memory leak or CPU spike.
- Verify no excessive API calls.

---

# 34. Final Product Feeling

The desktop pet should feel like:

> **Pompom escaped the chatbot and now lives on your computer.**

It should occasionally make the user think:

> "Wait... what is this little idiot doing?"

That feeling is the goal.

Pompom should not constantly demand attention.

It should exist quietly in the corner, occasionally doing something funny, reacting to the user, and reflecting the same personality and mood from the main MoodPet experience.

---

# 35. Definition of Done

The feature is complete when:

- [ ] Pompom can exist outside the browser.
- [ ] Transparent desktop window works.
- [ ] Always-on-top behavior works.
- [ ] Pompom can be moved.
- [ ] Pompom has idle behavior.
- [ ] Pompom can walk.
- [ ] Pompom can stop/sit.
- [ ] Pompom can perform autonomous actions.
- [ ] Autonomous actions use controlled randomness.
- [ ] Pompom reflects all 10 moods.
- [ ] Mood changes affect behavior.
- [ ] Clicking Pompom produces reactions.
- [ ] Pompom can open the main MoodPet interface.
- [ ] Pompom can be hidden.
- [ ] Pompom can be paused.
- [ ] Pompom can be closed cleanly.
- [ ] Existing MoodPet web app still works.
- [ ] Gemini API key remains secure.
- [ ] Autonomous behavior does not call Gemini unnecessarily.
- [ ] Performance remains lightweight.
- [ ] No major existing functionality is broken.

---

# FINAL INSTRUCTION

**Do not rebuild MoodPet.**

Treat the existing application as the foundation.

Read and understand the existing:

- `context.md`
- `design.md`
- `moodpet.md`
- `pompom.md`
- `ai-config.md`
- `second.md`
- `skills-lock.json`

before implementing this feature.

Then integrate Desktop Pompom as a new optional capability.

The result should feel like the same Pompom from the web application has become a small living creature on the user's desktop.