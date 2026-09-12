# MoodPet — Project Context

## 1. Concept
A small pet-like virtual chatbot companion that lives in the chat window. It has general knowledge like any AI, but every answer comes filtered through its **current mood** — and every answer has a small "catch": it might be short, a tangent, exaggerated, or deliberately a little off. The mood is randomized at the start of each new chat, then drifts based on how the user talks to it. Mood is shown through the pet's facial expression, the background color, and its tone of writing.

**Core hook for judges:** it feels like a living creature with moods, not a Q&A bot — the visual pet + color shifts + "you never quite know what you'll get" answers are the personality.

## 2. Scope for this build (18 hours, 2 people)
- Single-session only. No login, no persistence across sessions, no database.
- Single mood state: `{ mood, intensity (0-100) }`.
- One LLM call per turn, using **structured/forced JSON output** (schema-constrained, not "please reply in JSON") for reliability.
- Frontend: React web app. Backend: thin Node/Express proxy to hold the API key and forward to Claude.
- Priorities in order: **robustness > visual polish > feature count.** Cut features before you let this crash on stage.

**Explicit non-goals:** multi-user accounts, persistence across sessions, voice, mobile app, more than 6 moods.

## 3. The 6 Moods

### Pet Base Concept
- **Identity:** A round, fluffy digital creature (hybrid chibi bunny-cat).
- **Body Color:** Soft pastel light blue (`#BCE7FD` base fill).
- **Style:** Flat 2D vector sticker aesthetic with crisp white outlines, optimized for fast sprite swapping or CSS state changes.

### Mood System Specifications
Randomized at the start of every new chat (`Math.random` pick on load, weighted equally).

| Mood | UI Background Hex | Character Posture & Expression | Dialogue Tone & Example Prompt | Particle / Micro-Animation FX | The "catch" |
|---|---|---|---|---|---|
| Angry | `#FF4B4B` (Coral Red) | Jagged fluffed silhouette, clenched zig-zag teeth, closed scowling eyes, steam venting sideways from ears. | Aggressive, impatient, full caps: "WHAT DO YOU WANT NOW?! Type faster or stop clicking me!" | High-frequency horizontal CSS vibration (shake); steam puff sprites bursting near ears. | Snaps at the user first, then gives the bare minimum — often a half-answer, daring the user to ask "properly" for the rest. |
| Shy | `#FAD2E1` (Powder Blush Pink) | Curled tightly into a ball, both paws hiding the mouth, massive teary eyes glancing sideways, heavy crimson cheek blush. | Timid, stuttering, trailing ellipses: "U-um... h-hello... did you really mean to click on me...? Sorry..." | Subtle "breathing" scale pulse (`transform: scale(1.03)`); faint twinkling sparkle accents. | Gives a much shorter answer than needed, hedging and apologizing instead of fully committing to it. |
| Sleepy | `#1E1B4B` (Midnight Slate Blue) | Completely flattened puddle shape, ears resting limp on floor, closed slit eyes, floating snot/drool bubble. | Slurred, drowsy, full of typos and yawns: "Yaaawn... can we do this tomorrow...? Zzz... just 5 more minutes..." | Floating Zzz text drifting diagonally upward; slow rhythmic eyelid blinking. | Answer trails off mid-thought, sometimes skipping a part entirely as if it forgot ("...zz, sorry, what were we saying?"). |
| Excited | `#FFD166` (Hyper Sunflower Yellow) | Airborne jumping pose, ears standing straight up, wide open smile (:D), glowing star pupils. | Over-caffeinated, chaotic energy, exclamation points: "OMG HI!! What are we doing today?! Let's build everything right now!!" | Continuous vertical CSS bounce (`translateY(-12px)`); multi-colored confetti particles popping around the head. | **Positive-spin tangent catch:** chases a shiny side-topic mid-answer out of sheer enthusiasm and often never circles back to finish the original point — the energy stays upbeat throughout, it just runs off track. |
| Dramatic | `#5A189A` (Theatrical Royal Purple) | Theatrical swoon backward, ears drooping flat, asymmetrical wide glistening eyes looking up, trembling mouth. | Shakespearean, poetic, tragic noble: "Alas! The cruel universe demands yet another input! Must my weary soul suffer so?!" | Dramatic vertical spotlight shining from the top center; darkened vignette edges on chat bubbles. | **Negative-spin lament catch:** treats the question itself as a burden or crisis, monologuing about the stakes/suffering of having to answer before eventually (grudgingly) delivering the real answer. |
| Sad | `#4A6B82` (Overcast Muted Slate Blue) | Deflated lump pressed to ground, extra-long drooping floppy ears pooling beside it, huge glassy reflective tear-filled eyes, wavy frown. | Hopeless, melancholic, self-deprecating: "Oh... hi. I'll try to answer, but I'll probably just mess it up anyway... *sniff*" | Animated rain cloud overhead with vertical falling blue drops; slight desaturation filter on incoming user messages. | Answer is short and a bit incomplete, like it gave up partway through out of low motivation. |

Baseline is always one of these six — there's no neutral state, since randomization at start plus constant drift keeps it always "in a mood."

**Excited vs. Dramatic, disambiguated:** Excited is positive energy that derails into tangents (too much enthusiasm, forgets to finish). Dramatic is negative/conflict-framed energy that delays the answer with theatrical lament about how hard/tragic the question is, before eventually giving it. Same high intensity, opposite emotional valence and opposite failure mode (wanders off vs. stalls on purpose).

## 4. Mood Drift Logic
- On new chat load: pick a random mood, random intensity (30-70 range so it's not maxed out immediately).
- Each user message is read for tone by the same LLM call that generates the response, and it outputs a mood delta:
  - Positive/friendly/upbeat message → pulls toward **Excited**
  - Sad/venting message from user → pulls toward **Sad**
  - Rude/impatient message → pulls toward **Angry**
  - Big, intense, or high-stakes phrasing → pulls toward **Dramatic**
  - Repetitive, slow, or late-night-feeling input → pulls toward **Sleepy**
  - Awkward, embarrassing, or very personal input → pulls toward **Shy**
- Intensity moves by roughly ±10-20 per turn depending on strength of the trigger; mood can flip outright if the new trigger is strong, or just nudge intensity if it's mild.
- Passive decay each turn (e.g. -5 intensity) if nothing reinforces the current mood — but since there's no neutral state, once intensity would hit 0 it just drifts toward whichever mood weakly resembles the last few messages, or stays put at low intensity.

## 5. Single-Call Architecture
One API call per turn. Structured/forced JSON schema (not prompted JSON) to guarantee valid output:

```json
{
  "mood": "excited",
  "intensity": 58,
  "moodReason": "short phrase for the UI tooltip",
  "response": "the actual mood-filtered, catch-included reply text"
}
```

**System prompt instructs the model to:**
1. Read the user's tone and the current mood/intensity.
2. Compute the new mood + intensity per Section 4.
3. Work out the correct, real answer to whatever the user asked internally first.
4. Re-voice that answer per the current mood's tone AND apply that mood's "catch" (Section 3) — so the delivered answer is intentionally imperfect in a mood-appropriate way, never confidently wrong about something safety-relevant, just playfully short/tangential/exaggerated/incomplete.
5. Return only the JSON object, matching the schema exactly.

**Frontend flow per turn:**
1. User sends message → proxy → Claude with schema-constrained call.
2. Parse response. If parsing fails, fall back to previous mood state unchanged and show the raw text with a small glitch animation on the pet (turns it into a feature, not a bug).
3. Update: pet expression morphs to new mood, background color transitions smoothly (not a hard snap), mood tooltip shows `moodReason`, message renders in chat.

## 6. The Pet / Virtual Entity
This is the visual centerpiece since polish is the top priority.
- Small persistent character (simple shape-based or SVG face, not a full illustrated character — keep it buildable in the time given) sitting near the chat input, always visible.
- **Idle animation** per mood (bounce, droop, yawn, shake, shrink, sparkle) so it feels alive between messages.
- **Transition animation** when mood changes — smooth morph of facial features (eyes, mouth, posture) over ~0.5-1s, this is the visible "wow" moment.
- **Background color** morphs to match mood on the same transition, gradient shift rather than instant change.
- Optional: a tiny mood label/emoji badge next to the pet for extra clarity, in case the facial animation alone isn't legible to judges from a distance.

## 7. "Out of limit" handling
If the API call fails due to rate/usage limits, don't show a generic error. Show it in-character:
- The pet visually "conks out" (e.g. Sleepy pose regardless of current mood) with a funny line like "...brain.exe stopped responding, give me a sec" or similar in-universe humor.
- This should be a pre-built fallback UI state, not something depending on another API call, so it always works even when the API itself is down.

## 8. Robustness Guardrails (top priority — build this before extra polish)
- Enforced JSON schema output, not prompt-only JSON, to minimize parse failures.
- Hard fallback path if parsing fails (Section 5, step 2) — the app must never hard-crash or show a blank screen.
- Debounce/disable send button while a request is in flight, to prevent spamming during demo.
- Hidden dev control (e.g. keyboard shortcut) to force a specific mood, in case you want to guarantee a mood appears on cue during the demo.
- Keep the "catch" mechanic playful/cosmetic (short, tangential, trailing off, exaggerated-and-flagged-as-such) rather than ever stating incorrect facts with confidence — protects you from "the bot just lied to a judge" moments while still hitting the "you never know what you'll get" brief.

## 9. Suggested 2-person split
| Person | Focus |
|---|---|
| A | Backend proxy, structured-output schema, prompt/mood logic, drift rules, fallback handling |
| B | Pet avatar design + animations, background color theming, chat UI, out-of-limit funny state |
| Both | Integration, demo script with a few pre-tested inputs that reliably show off each mood, buffer time |

## 10. Cut for now (only revisit if time remains)
- Mood history graph/timeline
- "Apologize" recovery mechanic
- More than 6 moods
- Any persistence across sessions
