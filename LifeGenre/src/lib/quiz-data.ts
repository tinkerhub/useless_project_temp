export type GenreId =
  | "thriller"
  | "comedy"
  | "coming-of-age"
  | "horror"
  | "documentary"
  | "bollywood"
  | "roadtrip"
  | "mystery";

export type Genre = {
  id: GenreId;
  name: string;
  emoji: string;
  tagline: string;
  logline: string;
  accent: string; // oklch value
  glow: string;
  details: { label: string; value: string }[];
  review: string;
  trailer: string[];
};

export const GENRES: Record<GenreId, Genre> = {
  thriller: {
    id: "thriller",
    name: "Psychological Thriller",
    emoji: "🧠",
    tagline: "Nothing happened. You are still not okay.",
    logline:
      "In a world where a single \"can we talk?\" can end civilizations… one overthinker must survive their own brain.",
    accent: "oklch(0.72 0.16 265)",
    glow: "oklch(0.55 0.2 280)",
    details: [
      { label: "Starring", value: "You, at 3AM, staring at the ceiling" },
      { label: "Main Antagonist", value: "A text that says 'ok'" },
      { label: "Supporting Villain", value: "Your memory from 2019" },
      { label: "Plot Twist", value: "Nobody was mad at you" },
      { label: "Budget", value: "₹47 and emotional instability" },
      { label: "IMDb Rating", value: "8.7/10 according to your mother" },
    ],
    review: "\"Confusing, unnecessarily stressful, and somehow renewed for another season.\"",
    trailer: ["IN A WORLD...", "WHERE NOTHING IS WRONG...", "ONE MIND...", "REFUSES TO BELIEVE IT.", "THEY WERE JUST TIRED."],
  },
  comedy: {
    id: "comedy",
    name: "Low-Budget Comedy",
    emoji: "🤡",
    tagline: "Nothing goes according to plan, but the plot keeps moving.",
    logline:
      "In a world with no script supervisor… one protagonist trips over absolutely everything and calls it character development.",
    accent: "oklch(0.82 0.17 85)",
    glow: "oklch(0.7 0.19 60)",
    details: [
      { label: "Main Character Energy", value: "Accidentally funny" },
      { label: "Superpower", value: "Surviving embarrassing situations" },
      { label: "Main Villain", value: "Basic tasks" },
      { label: "Budget", value: "Suspiciously low" },
      { label: "Runtime", value: "Too long for the amount of plot" },
      { label: "IMDb Rating", value: "6.9/10 (nice)" },
    ],
    review: "\"We don't know how this got approved, but we're watching.\"",
    trailer: ["IN A WORLD...", "WHERE THE PLAN...", "NEVER SURVIVES...", "ONE PERSON...", "WAVES AT SOMEONE ELSE."],
  },
  "coming-of-age": {
    id: "coming-of-age",
    name: "Coming-of-Age Film",
    emoji: "🌱",
    tagline: "Soft lighting. Slow growth. Suspicious amounts of hope.",
    logline:
      "In a world of small wins and long walks… one human quietly starts becoming a person their past self would text about.",
    accent: "oklch(0.8 0.14 155)",
    glow: "oklch(0.65 0.16 165)",
    details: [
      { label: "Starring", value: "You, but slightly healed" },
      { label: "Soundtrack", value: "Indie song you replayed 400 times" },
      { label: "Main Conflict", value: "Growth is annoyingly slow" },
      { label: "Plot Twist", value: "You were doing fine actually" },
      { label: "Budget", value: "One journal and good intentions" },
      { label: "IMDb Rating", value: "9.1/10, festival darling" },
    ],
    review: "\"Nothing explodes and yet I cried. Rude.\"",
    trailer: ["IN A WORLD...", "OF SMALL BEGINNINGS...", "ONE PERSON...", "WILL FINALLY...", "TEXT BACK ON TIME."],
  },
  horror: {
    id: "horror",
    name: "Survival Horror",
    emoji: "🧟",
    tagline: "Every notification is a jump scare.",
    logline:
      "In a world where deadlines appear without warning… one student must confront the terrifying question: \"Wait… was that due TODAY?\"",
    accent: "oklch(0.65 0.22 25)",
    glow: "oklch(0.5 0.24 20)",
    details: [
      { label: "Main Villain", value: "Monday morning" },
      { label: "Weapon of Choice", value: "Caffeine" },
      { label: "Current Objective", value: "Survive until Friday" },
      { label: "Difficulty", value: "Impossible" },
      { label: "Supporting Villain", value: "Google Classroom" },
      { label: "IMDb Rating", value: "Screaming/10" },
    ],
    review: "\"Genuinely terrifying. The monster is a calendar.\"",
    trailer: ["IN A WORLD...", "WHERE DEADLINES...", "HAVE NO MERCY...", "ONE STUDENT...", "WILL DISCOVER...", "THEY MISSED THE SUBMISSION."],
  },
  documentary: {
    id: "documentary",
    name: "Documentary About Procrastination",
    emoji: "📚",
    tagline: "Seven free hours. Zero output. Fascinating.",
    logline:
      "A fascinating exploration into how one human can have 7 hours of free time and still complete absolutely nothing.",
    accent: "oklch(0.78 0.11 210)",
    glow: "oklch(0.6 0.14 220)",
    details: [
      { label: "Main Activity", value: "Preparing to prepare" },
      { label: "Greatest Enemy", value: "Starting" },
      { label: "Special Skill", value: "Opening 27 tabs" },
      { label: "Plot Progression", value: "Delayed indefinitely" },
      { label: "Narrator", value: "A very calm British man" },
      { label: "IMDb Rating", value: "Will rate later" },
    ],
    review: "\"Slow burn. Extremely slow. Possibly not burning at all.\"",
    trailer: ["IN A WORLD...", "OF INFINITE TIME...", "ONE HUMAN...", "OPENS A DOCUMENT...", "AND CLOSES IT."],
  },
  bollywood: {
    id: "bollywood",
    name: "Bollywood Family Drama",
    emoji: "💃",
    tagline: "Nobody knows what happened. Everyone is emotionally involved.",
    logline:
      "In a world where guests arrive without notice… one family turns a missing spoon into a three-generation conflict.",
    accent: "oklch(0.75 0.19 350)",
    glow: "oklch(0.6 0.22 355)",
    details: [
      { label: "Plot Device", value: "Miscommunication" },
      { label: "Background Music", value: "Unnecessarily dramatic violin" },
      { label: "Main Event", value: "Someone is definitely crying" },
      { label: "Episode Length", value: "3 hours minimum" },
      { label: "Main Antagonist", value: "Relatives with opinions" },
      { label: "IMDb Rating", value: "Blockbuster/10" },
    ],
    review: "\"Zoom into three faces and I am instantly invested.\"",
    trailer: ["IN A WORLD...", "WHERE GUESTS ARRIVE...", "WITHOUT WARNING...", "ONE FAMILY...", "WILL ARGUE ABOUT NOTHING.", "LOUDLY."],
  },
  roadtrip: {
    id: "roadtrip",
    name: "Chaotic Road Trip Movie",
    emoji: "🚗",
    tagline: "No destination. Excellent playlist.",
    logline:
      "In a world with no itinerary… a group of unqualified individuals leave three hours late and call it spontaneity.",
    accent: "oklch(0.8 0.16 60)",
    glow: "oklch(0.66 0.18 45)",
    details: [
      { label: "Starring", value: "You and questionable decision-making" },
      { label: "Vehicle", value: "Held together by vibes" },
      { label: "Main Villain", value: "Group chat logistics" },
      { label: "Plot Twist", value: "Nobody booked anything" },
      { label: "Budget", value: "Split unevenly, forever" },
      { label: "IMDb Rating", value: "7.4/10, great soundtrack" },
    ],
    review: "\"Directionless in every possible sense. Loved it.\"",
    trailer: ["IN A WORLD...", "WITH NO PLAN...", "FIVE FRIENDS...", "LEAVE THREE HOURS LATE...", "AND CALL IT AN ADVENTURE."],
  },
  mystery: {
    id: "mystery",
    name: "Mystery With No Plot Resolution",
    emoji: "🕵️",
    tagline: "Clues everywhere. Answers nowhere.",
    logline:
      "In a world full of loose ends… one protagonist investigates their own life and finds the writers already left.",
    accent: "oklch(0.75 0.09 250)",
    glow: "oklch(0.55 0.12 255)",
    details: [
      { label: "Starring", value: "You, squinting" },
      { label: "Main Clue", value: "A screenshot with no context" },
      { label: "Detective Method", value: "Vibes and assumptions" },
      { label: "Plot Twist", value: "There is no plot" },
      { label: "Ending", value: "Ambiguous, deliberately" },
      { label: "IMDb Rating", value: "???/10" },
    ],
    review: "\"Two seasons in and I still don't know what the show is about.\"",
    trailer: ["IN A WORLD...", "FULL OF CLUES...", "ONE PERSON...", "ASKS A QUESTION...", "AND GETS NOTHING BACK."],
  },
};

export type Option = { text: string; scores: Partial<Record<GenreId, number>> };
export type Question = { q: string; options: Option[] };

export const QUESTIONS: Question[] = [
  {
    q: 'Your professor says: "This won\'t come for the exam." You:',
    options: [
      { text: "Trust them completely", scores: { "coming-of-age": 2, roadtrip: 1 } },
      { text: "Screenshot it for legal purposes", scores: { thriller: 2, mystery: 1 } },
      { text: "Experience immediate fear", scores: { horror: 2, thriller: 1 } },
      { text: "Study the entire textbook anyway", scores: { documentary: 1, horror: 2 } },
    ],
  },
  {
    q: "Your alarm goes off at 6 AM. You:",
    options: [
      { text: "Wake up and seize the day", scores: { "coming-of-age": 3 } },
      { text: "Hit snooze exactly once", scores: { documentary: 1, "coming-of-age": 1 } },
      { text: "Snooze until morning stops existing", scores: { documentary: 3 } },
      { text: "Wake up in panic at 8:47", scores: { comedy: 2, horror: 2 } },
    ],
  },
  {
    q: 'Someone texts "Can we talk?" You immediately:',
    options: [
      { text: "Ask what's wrong", scores: { "coming-of-age": 2 } },
      { text: 'Say "sure!" and move on', scores: { comedy: 1, roadtrip: 2 } },
      { text: "Review every interaction since 2019", scores: { thriller: 3 } },
      { text: "Consider a new identity abroad", scores: { thriller: 2, mystery: 2 } },
    ],
  },
  {
    q: "You open your laptop to study and end up:",
    options: [
      { text: "Actually studying", scores: { "coming-of-age": 3 } },
      { text: "Organizing folders", scores: { documentary: 3 } },
      { text: "Watching productivity videos", scores: { documentary: 3 } },
      { text: "Deep-cleaning your entire room", scores: { documentary: 2, comedy: 2 } },
    ],
  },
  {
    q: "Deadline is tonight. Your strategy:",
    options: [
      { text: "Finished it early", scores: { "coming-of-age": 3 } },
      { text: "Working steadily", scores: { "coming-of-age": 2, documentary: 1 } },
      { text: "Waiting for motivation", scores: { documentary: 3 } },
      { text: "Fear is an excellent productivity tool", scores: { horror: 3 } },
    ],
  },
  {
    q: "Your family says guests are coming. You:",
    options: [
      { text: "Continue existing normally", scores: { mystery: 2, roadtrip: 1 } },
      { text: "Help clean", scores: { "coming-of-age": 2 } },
      { text: "Suddenly become the cleaning staff", scores: { bollywood: 3 } },
      { text: "Watch an argument erupt over nothing", scores: { bollywood: 3, comedy: 1 } },
    ],
  },
  {
    q: "You hear your name in another room. You:",
    options: [
      { text: "Ignore it", scores: { roadtrip: 2 } },
      { text: "Keep doing your thing", scores: { "coming-of-age": 2 } },
      { text: "Become FBI-level attentive", scores: { thriller: 2, mystery: 2 } },
      { text: "Assume your reputation is over", scores: { thriller: 3, bollywood: 1 } },
    ],
  },
  {
    q: 'Your friend says "I\'m outside." You:',
    options: [
      { text: "Are already ready", scores: { "coming-of-age": 2 } },
      { text: "Start getting ready", scores: { roadtrip: 2 } },
      { text: 'Ask for "5 minutes" (a lie)', scores: { comedy: 2, roadtrip: 2 } },
      { text: "Were never informed of this event", scores: { comedy: 3, mystery: 1 } },
    ],
  },
  {
    q: "You have free time. Naturally you:",
    options: [
      { text: "Relax like a normal person", scores: { "coming-of-age": 3 } },
      { text: "Watch a movie", scores: { roadtrip: 1, documentary: 1 } },
      { text: "Feel guilty for relaxing", scores: { thriller: 2, documentary: 1 } },
      { text: "Stress while doing absolutely nothing", scores: { documentary: 3, horror: 1 } },
    ],
  },
  {
    q: "Your life currently feels like:",
    options: [
      { text: "Things are slowly making sense", scores: { "coming-of-age": 3 } },
      { text: "A funny series of unfortunate events", scores: { comedy: 3, roadtrip: 1 } },
      { text: "One inconvenience away from collapse", scores: { horror: 3 } },
      { text: "Written by someone who hates the lead", scores: { mystery: 3, thriller: 1 } },
    ],
  },
  {
    q: "You check your bank balance and:",
    options: [
      { text: "Feel responsible", scores: { "coming-of-age": 3 } },
      { text: "Feel neutral", scores: { documentary: 1, mystery: 1 } },
      { text: "Close the app immediately", scores: { horror: 2, comedy: 1 } },
      { text: "Wonder if money is a social construct", scores: { roadtrip: 3, comedy: 1 } },
    ],
  },
  {
    q: '"Don\'t panic," they say. You:',
    options: [
      { text: "Stay calm", scores: { "coming-of-age": 3 } },
      { text: "Ask why", scores: { mystery: 2 } },
      { text: "Begin panicking slightly", scores: { horror: 2, bollywood: 1 } },
      { text: "Already imagined 47 worst-case scenarios", scores: { thriller: 3 } },
    ],
  },
];

export const LOADING_LINES = [
  "Reviewing questionable life choices...",
  "Calculating emotional damage...",
  "Contacting the screenplay department...",
  "Finding plot inconsistencies...",
  "Determining whether therapy exists in this universe...",
];

export function scoreQuiz(answers: number[]): GenreId {
  const totals = {} as Record<GenreId, number>;
  (Object.keys(GENRES) as GenreId[]).forEach((g) => (totals[g] = 0));
  answers.forEach((optIdx, qIdx) => {
    const opt = QUESTIONS[qIdx]?.options[optIdx];
    if (!opt) return;
    for (const [g, pts] of Object.entries(opt.scores)) {
      totals[g as GenreId] += pts ?? 0;
    }
  });
  const ranked = (Object.keys(totals) as GenreId[]).sort((a, b) => totals[b] - totals[a]);
  return ranked[0] ?? "comedy";
}
