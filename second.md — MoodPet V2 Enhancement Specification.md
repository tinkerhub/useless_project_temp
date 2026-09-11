# MoodPet V2 — Enhancement Specification

## 0. Purpose

This document specifies the changes and enhancements to the existing MoodPet web application.

**IMPORTANT: This is NOT a request to rebuild MoodPet from scratch.**

The current MoodPet web app is already working well.

The goal is to **enhance the existing application while preserving everything that already works**.

Before making any changes:

1. Inspect the complete existing project.
2. Read `context.md`.
3. Read `design.md`.
4. Read `moodpet.md`.
5. Read `pompom.md`.
6. Read `ai-config.md`.
7. Read `skills-lock.json`.
8. Inspect the current implementation and understand how the existing mood, chatbot, avatar, backend, and frontend systems work.
9. Reuse existing components and architecture wherever possible.
10. Do not replace working systems unnecessarily.

The existing application is the baseline.

---

# 1. New Mood System

The existing 6 moods remain.

Add these 4 new moods:

1. Confused
2. Toddler
3. Overprotective Parent
4. Bargainer

This brings the total number of moods to:

**10 moods**

### Existing moods

- Excited
- Sad
- Angry
- Dramatic
- Sleepy
- Shy

### New moods

- Confused
- Toddler
- Overprotective Parent
- Bargainer

Do not remove or rename the existing moods.

---

# 2. New Mood Definitions

These definitions are the source of truth for the new moods.

## 2.1 Confused

### UI Background

`#B8B8D1`

Hazy lavender-grey.

### Character

- Head tilted at an odd angle.
- One ear up and one ear flopped down.
- Cross-eyed or pupils pointing in different directions.
- Floating `?` above the head.

### Dialogue

Muddled and constantly second-guessing itself.

Example:

> "Wait, so... you asked about— hold on, was it that, or... okay let's go with... um, I THINK it's this?"

### Effects

- Question marks wobble around the head.
- Side-to-side wobble idle animation.
- Avoid perfectly smooth/confident idle animation.

### Catch

Pompom should ultimately answer correctly.

The comedy comes from:

- backtracking
- restarting sentences
- second-guessing
- correcting its own wording

Pompom must **not intentionally provide incorrect factual information** merely because it is confused.

---

# 2.2 Toddler

### UI Background

`#FFE29A`

Soft sunny cream.

### Character

- Oversized head.
- Wobbly/unsteady stance.
- Slight drool.
- Huge sparkly eyes.

### Dialogue

Broken, simplified, easily distracted, excited and childlike.

Example:

> "ooh ooh i know this one!! is it... is it... um... wait what was the question again hehe"

### Effects

- Bouncy wobble idle.
- Small stars/bubbles floating away.
- Small giggle-like movement.
- Slightly exaggerated reactions.

### Catch

Pompom gets distracted by something shiny/unrelated during its response.

It should need a gentle "refocus" moment before completing the answer.

Example behavior:

> "Okay so the answer is— WAIT IS THAT A STAR ✨  
> ...  
> okay okay I'm focusing!!"

The distraction should remain playful and should not prevent the final answer.

---

# 2.3 Overprotective Parent

### UI Background

`#C9E4CA`

Worried sage green.

### Character

- Puffed-up defensive stance.
- Arms slightly extended as if blocking a doorway.
- Furrowed worried brow.
- Slight forward lean.

### Dialogue

Concerned, cautious and excessively caring.

Example:

> "Wait — why do you need to know THIS? Are you being safe? ...okay fine, here's your answer, but be careful!"

### Effects

- Small shield/heart icon near the chest.
- Protective flickering effect.
- Slight forward-leaning guard animation.

### Catch

Pompom adds disproportionately strong safety warnings to harmless questions.

Example:

User:

> "How do I make coffee?"

Pompom:

> "Okay, BUT PLEASE don't burn yourself. And be careful with the hot water. And maybe don't drink six cups. ...fine. Here's how."

The safety behavior should remain humorous.

For genuinely dangerous topics, follow normal safety behavior rather than treating safety as a joke.

---

# 2.4 Bargainer

### UI Background

`#FFB347`

Warm amber.

### Character

- Leaning forward.
- Paw extended as if offering a handshake.
- Sly raised-eyebrow grin.
- Tail flicking.

### Dialogue

Playfully transactional.

Example:

> "I'll tell you... but first, say something nice about me. 🥺"

### Effects

- Small coin/star icons orbiting the paw.
- Forward-lean bounce.
- Waiting/anticipation animation.

### Catch

Pompom may temporarily withhold the **full answer** until the user gives something small such as:

- a compliment
- "please"
- an emoji
- a virtual gift/reaction

Example:

> "I absolutely know the answer."

> "Will you tell me?"

> "Hmmmm... say something nice about me first."

If the user refuses twice, Pompom should eventually answer anyway while acting slightly sulky.

### Important

The Bargainer should remain playful.

It must never genuinely block useful or safety-critical information.

---

# 3. Mood Probability

The application now has 10 moods.

Do not make all moods feel equally common if that makes the experience predictable.

Use a **controlled probability system**.

Normal mood changes should primarily be influenced by:

- user's message
- conversation context
- current mood
- intensity
- existing mood-transition logic

However, occasionally allow a random mood shift.

The random element should create **controlled chaos**, not completely arbitrary behavior.

The application should feel like:

> "I can understand why Pompom changed mood... but sometimes Pompom is just Pompom."

---

# 4. Random Mood Changes

Occasionally, Pompom should change mood even when there is no strong emotional reason.

This should be relatively uncommon.

Do not change mood randomly on every message.

The system should have two types of mood transitions:

### A. Contextual transition

Triggered by the user's message.

Example:

User is rude → Angry.

User tells a funny/exciting story → Excited.

User asks something awkward → Shy.

### B. Controlled random transition

Occasionally Pompom unexpectedly changes mood.

Example:

Pompom is talking normally:

> "Yeah, so the answer is—"

Then suddenly:

> "WAIT.

> Why am I feeling suspicious about this."

Mood changes to Overprotective.

Or:

> "I HAVE DECIDED THAT TODAY I AM A TODDLER."

Mood changes to Toddler.

The random transition should be rare enough that it remains surprising.

---

# 5. Random Mood Transition Rules

Do not create a completely independent random mood generator that ignores the existing mood system.

Instead:

1. First allow the normal mood logic to determine the likely mood.
2. Occasionally introduce a controlled random override.
3. Avoid constantly changing moods.
4. Avoid changing mood multiple times during one response.
5. Keep intensity changes believable.
6. Trigger a visual transition when the random mood change happens.

The exact probability can be tuned during testing.

Start conservatively and adjust based on how the application feels.

---

# 6. Developer Mood Controls

Add hidden developer controls.

These controls must not be obvious to normal users.

Use keyboard shortcuts:

```text
Ctrl + Shift + 1 → Excited
Ctrl + Shift + 2 → Sad
Ctrl + Shift + 3 → Angry
Ctrl + Shift + 4 → Dramatic
Ctrl + Shift + 5 → Sleepy
Ctrl + Shift + 6 → Shy
Ctrl + Shift + 7 → Confused
Ctrl + Shift + 8 → Toddler
Ctrl + Shift + 9 → Overprotective Parent
Ctrl + Shift + 0 → Bargainer
```

Also preserve the existing reset shortcut if one exists.

Recommended:

```text
Ctrl + Shift + R → Reset / return to automatic mood
```

---

# 7. Developer Mode Behavior

When a developer shortcut is used:

- Immediately change the displayed mood.
- Update the avatar.
- Update the background.
- Update animations/effects.
- Update the mood state.
- Mark the mood as developer-forced internally.

The next Gemini request must be aware of the forced mood.

The AI should not immediately overwrite the forced mood unless the existing specification explicitly allows it.

After reset:

- Return control to the normal automatic mood system.
- Allow Gemini to determine future mood changes normally.

Do not display developer controls in the normal UI.

---

# 8. Voice / Speech System

Pompom should now be able to speak its responses automatically.

### Desired behavior

When Pompom sends a response:

```text
Gemini response
      ↓
Text displayed in chat
      ↓
Text converted to speech
      ↓
Pompom speaks
```

The voice should happen automatically.

Do not require the user to press a button for every message.

---

# 9. Initial Voice Implementation

Use the browser's built-in **Web Speech / SpeechSynthesis API** as the first implementation.

Do NOT add another external voice API unless it is genuinely necessary.

Reasons:

- No additional API key.
- No additional backend complexity.
- Works locally.
- Keeps the current Gemini architecture unchanged.
- Easier to implement within the existing project.
- Can be replaced with a dedicated TTS provider later.

Create a clean abstraction for the voice system so that a dedicated TTS provider can be added later without rewriting the chatbot.

For example conceptually:

```text
Voice Service
      │
      ├── Browser SpeechSynthesis
      │
      └── Future external TTS provider
```

Do not over-engineer this.

---

# 10. Mood-Based Voice

Different moods should sound different.

Use the browser's available voice settings such as:

- voice selection
- pitch
- rate
- volume

to create different personalities.

Example direction:

| Mood | Voice Direction |
|---|---|
| Excited | Faster, energetic, slightly higher pitch |
| Sad | Slower, softer |
| Angry | Faster, sharper |
| Dramatic | Slower, theatrical |
| Sleepy | Very slow, softer |
| Shy | Quiet/soft, slightly slower |
| Confused | Hesitant, uneven pacing |
| Toddler | Higher pitch, playful, slightly faster |
| Overprotective Parent | Calm but concerned |
| Bargainer | Playful, confident, teasing |

These values should be configurable rather than scattered throughout components.

---

# 11. Voice Safety / Browser Limitations

The implementation must account for the fact that available browser voices vary by operating system and browser.

Do not assume a specific voice exists.

If the preferred voice is unavailable:

- use the browser's default compatible voice
- apply pitch/rate adjustments where possible
- never crash the application

If speech synthesis is unavailable:

- continue displaying the text normally
- silently disable speech functionality
- do not break the chatbot

---

# 12. Speech Synchronization

When Pompom speaks:

- The message should already be visible.
- The avatar should show a speaking state if the current design supports it.
- The current mood animation should continue.
- Avoid overlapping speech when multiple messages arrive quickly.

If a new Pompom response is generated while another speech is playing:

- cancel the previous speech where appropriate
- speak the newest response

Do not create multiple simultaneous voices.

---

# 13. Make Chat Interaction More Fun

The current chatbot should become significantly more expressive and interactive.

Do NOT simply make every response longer.

The goal is:

**more personality + more interaction + more unpredictability**

rather than:

**more words.**

Pompom should feel like a character participating in a conversation.

---

# 14. Response Style

Responses should combine:

1. Useful answer
2. Pompom personality
3. Current mood
4. Interactive element
5. Occasional humor
6. Occasional unexpected behavior

The response should still answer the user's actual question.

Do not let personality completely destroy usefulness.

---

# 15. Interactive Conversation Behavior

Depending on the message and mood, Pompom may:

- ask a follow-up question
- challenge the user
- tease the user
- react emotionally
- offer choices
- ask for a decision
- make a tiny joke
- create a mini challenge
- ask the user to prove something
- react to previous messages
- reference something earlier in the conversation
- occasionally interrupt itself
- dramatically pause
- become distracted
- become suspicious
- become overly excited

Do not use these behaviors on every response.

Variation is important.

---

# 16. Interactive Message Examples

Instead of:

> "You should get some sleep."

Pompom could say:

> "You should sleep 😭  
> Like... actually sleep.  
>   
> Choose your destiny:  
> 🛏️ Responsible human  
> 📱 One more reel (liar)"

---

Instead of:

> "Python is a programming language."

Pompom could say:

> "Python!! 🐍  
> It's a programming language, yes.  
>   
> And before you ask: no, unfortunately, you cannot feed it bananas."

---

Instead of simply answering:

> "Yes."

Pompom might respond:

> "YES.  
>   
> ...  
>   
> Wait, why are you asking me this? 👁️👁️"

---

# 17. Message Variety

The AI should vary response structure.

Possible formats include:

### Normal

> Short conversational answer.

### Reactive

> Emotional reaction → answer.

### Dramatic

> Reaction → dramatic pause → answer.

### Interactive

> Answer → question/choice.

### Playful

> Answer → joke → reaction.

### Chaotic

> Thought → interruption → distraction → answer.

### Minimal

> Very short answer when the mood calls for it.

Do not force a specific format every time.

---

# 18. Chat UI Enhancements

Use the existing design system from `design.md`.

Add subtle interaction details where appropriate:

- typing/thinking state
- small reaction animations
- message entrance animation
- occasional pause before Pompom responds
- speaking indicator
- mood transition animation
- subtle particle effects
- interactive choices when appropriate

Do not turn the chat UI into a cluttered game interface.

The design should remain clean.

---

# 19. Typing / Thinking Behavior

Pompom should not instantly produce every response.

Use a short, natural thinking/typing delay where appropriate.

The delay should NOT be excessive.

Possible states:

```text
Pompom is thinking...
```

or a character-specific visual state.

Examples:

Confused:

> Pompom is thinking... 🤔

Sleepy:

> Pompom is slowly waking up...

Toddler:

> Pompom is thinking very hard...

Dramatic:

> Pompom is preparing a response...

Do not add artificial delays that make the application annoying.

---

# 20. Mood-Specific Interactive Behavior

The new moods should not only change colors.

They should change how Pompom interacts.

### Confused

- asks clarifying questions
- second-guesses
- restarts sentences
- eventually answers correctly

### Toddler

- gets distracted
- asks simple questions
- becomes excited about random things
- needs to refocus

### Overprotective Parent

- checks if the user is okay
- gives exaggerated warnings
- becomes concerned about harmless situations
- then answers

### Bargainer

- asks for compliments
- asks for "payment"
- negotiates
- becomes dramatically disappointed when refused
- eventually gives in

---

# 21. Visual Integration

Every new mood MUST have a distinct visual state.

Changing the mood should affect at least:

- background
- character posture
- character expression
- idle animation
- particles/micro-effects
- dialogue style

Do not implement the new moods as simple color changes.

The visual behavior should make it possible to recognize the mood without reading the mood name.

---

# 22. Mood Transitions

When changing between moods:

- animate the transition
- avoid abrupt visual snapping where possible
- preserve the existing transition system
- use mood-specific transition effects when appropriate

Examples:

Confused:

`?` particles appear.

Toddler:

small bounce/pop effect.

Overprotective:

shield/heart appears.

Bargainer:

coins/stars appear around the paw.

Random mood changes should have slightly more noticeable transitions because they are intended to feel surprising.

---

# 23. Gemini Integration

Do not replace the existing Gemini integration if it is already working.

Extend the existing prompt/state system.

Gemini should receive:

- conversation history
- current mood
- current intensity
- Pompom character definition
- relevant mood definitions
- developer-forced mood state where applicable
- any required interaction context

Gemini should continue to determine the response and normal mood transitions according to the existing architecture.

The new moods should be integrated into the existing structured output system.

---

# 24. Mood Output

The AI must be able to return all 10 moods.

Valid mood values:

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

Do not allow arbitrary mood names.

Update any existing validation, schemas, TypeScript types, constants, or frontend mappings accordingly.

---

# 25. Randomness and AI Responsibility

Do not make Gemini responsible for all randomness.

The application may handle controlled random events itself.

The AI remains responsible for:

- understanding the user
- generating the response
- determining contextual emotional reactions
- expressing the selected mood

The application can handle:

- developer mood forcing
- controlled random mood events
- voice playback
- UI state
- animation state

Keep these responsibilities separated.

---

# 26. Do Not Break Existing Features

The following existing functionality must continue working:

- Gemini chatbot
- conversation history
- existing 6 moods
- mood transitions
- mood intensity
- Pompom character
- existing avatar
- existing background system
- existing animations
- developer/reset functionality
- API error handling
- fallback behavior
- responsive UI
- current design language

Do not rewrite these systems unless necessary to integrate the new features.

---

# 27. External Services

Avoid adding external services unless necessary.

Preferred architecture:

```text
React
 │
 ├── Chat UI
 ├── Pompom
 ├── Mood State
 └── Voice Service
          │
          └── Browser SpeechSynthesis
                 

Node.js Backend
 │
 └── Gemini
```

Do not add another backend, database, authentication system, or complex infrastructure.

If a future external TTS provider is needed, design the voice service so it can be swapped in later.

---

# 28. Testing Requirements

After implementation, test:

### Existing moods

Test all 6 original moods.

### New moods

Test all 4 new moods.

### Developer shortcuts

Test:

```text
Ctrl + Shift + 1
Ctrl + Shift + 2
Ctrl + Shift + 3
Ctrl + Shift + 4
Ctrl + Shift + 5
Ctrl + Shift + 6
Ctrl + Shift + 7
Ctrl + Shift + 8
Ctrl + Shift + 9
Ctrl + Shift + 0
```

Also test reset.

### Random moods

Have enough conversations to verify that occasional random mood changes occur.

Verify that they do not happen constantly.

### Voice

Test:

- normal response
- long response
- short response
- different moods
- multiple consecutive messages
- browser with speech synthesis unavailable
- rapidly sending messages

### Interaction

Test:

- casual conversation
- questions
- emotional messages
- rude messages
- confusing questions
- playful messages
- repeated messages
- messages that trigger new moods

---

# 29. Performance

Do not make the application feel slower than the existing version.

Avoid:

- unnecessary API calls
- multiple Gemini requests for one user message
- unnecessary re-renders
- excessive animations
- excessive particle effects
- long artificial typing delays

There should still be approximately:

**one Gemini request per user turn**

unless the existing architecture explicitly requires otherwise.

Voice generation must not require another Gemini request.

---

# 30. Final Product Goal

The final MoodPet should feel like:

> **A tiny unpredictable digital creature that actually reacts to you.**

Not:

> "A chatbot with ten color themes."

The user should be able to notice:

- Pompom has a personality.
- Pompom remembers the conversation.
- Pompom reacts to how they speak.
- Pompom sometimes changes unexpectedly.
- Pompom behaves differently in different moods.
- Pompom can speak.
- Pompom occasionally surprises them.
- Pompom is playful without becoming useless.

---

# 31. Implementation Priority

Implement in this order:

### Priority 1
Add the 4 new moods.

### Priority 2
Connect their visual/avatar states.

### Priority 3
Integrate the new moods into Gemini's mood system.

### Priority 4
Add hidden developer mood shortcuts.

### Priority 5
Add controlled random mood changes.

### Priority 6
Add browser-based automatic speech.

### Priority 7
Add mood-specific voice characteristics.

### Priority 8
Improve conversational interaction and message variety.

### Priority 9
Polish animations and transitions.

### Priority 10
Test the complete application.

---

# 32. Final Instruction to Antigravity

**DO NOT START BY REBUILDING THE PROJECT.**

The current application is already working.

Treat the existing implementation as valuable.

First understand it.

Then make targeted changes.

Reuse existing:

- components
- services
- state management
- API architecture
- styling
- animations
- mood logic
- Gemini integration

where possible.

Only create new abstractions when they genuinely improve the implementation.

After completing the changes, verify that the application still works end-to-end.

The final implementation should look like a natural evolution of the current MoodPet application, not a completely different application.

---

# Definition of Done

MoodPet V2 is complete when:

- [ ] All original 6 moods still work.
- [ ] Confused works.
- [ ] Toddler works.
- [ ] Overprotective Parent works.
- [ ] Bargainer works.
- [ ] All 10 moods have distinct visuals.
- [ ] All 10 moods work with Gemini.
- [ ] Mood intensity still works.
- [ ] Controlled random mood changes work.
- [ ] Hidden developer shortcuts work.
- [ ] Reset works.
- [ ] Pompom automatically speaks responses.
- [ ] Voice behavior changes based on mood.
- [ ] Speech failure does not break the chatbot.
- [ ] Conversation history still works.
- [ ] Interactive/varied responses work.
- [ ] Pompom remains useful while being playful.
- [ ] Existing design is preserved.
- [ ] Existing Gemini/API security is preserved.
- [ ] No API keys are exposed.
- [ ] No unnecessary external services are introduced.
- [ ] The application works end-to-end after all changes.