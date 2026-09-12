export type CharacterId =
  | "harry"
  | "hermione"
  | "ron"
  | "draco"
  | "dumbledore"
  | "snape"
  | "dobby"
  | "hagrid"
  | "luna"
  | "sirius";

export type Answer = {
  label: string;
  text: string;
  points: [CharacterId, CharacterId];
};

export type Question = {
  prompt: string;
  answers: Answer[];
};

const a = (
  label: string,
  text: string,
  points: [CharacterId, CharacterId],
): Answer => ({ label, text, points });

export const questions: Question[] = [
  {
    prompt:
      "🏰 You arrive at Hogwarts and discover your name isn't on the class list. What do you do?",
    answers: [
      a("A", "Politely ask the professor to check again.", ["hermione", "dobby"]),
      a("B", "Assume this is somehow a conspiracy.", ["harry", "sirius"]),
      a("C", "Say nothing and attend the class anyway.", ["luna", "hagrid"]),
      a("D", "Find whoever is responsible and demand an explanation.", ["draco", "snape"]),
      a("E", "\u201cThat's okay. I'll just live here.\u201d", ["ron", "dumbledore"]),
    ],
  },
  {
    prompt: "🧹 Your broom suddenly starts flying by itself.",
    answers: [
      a("A", "\u201cTHIS IS AMAZING.\u201d", ["harry", "sirius"]),
      a("B", "\u201cEveryone remain calm. I have a theory.\u201d", ["hermione", "dumbledore"]),
      a("C", "Jump off immediately. Survival comes first.", ["ron", "snape"]),
      a("D", "Try to control it because obviously I can handle it.", ["draco", "hagrid"]),
      a("E", "\u201cHonestly? Let it cook.\u201d", ["luna", "dobby"]),
    ],
  },
  {
    prompt: "🦉 An owl delivers a letter saying: \u201cWe know what you did.\u201d",
    answers: [
      a("A", "\u201cI DIDN'T DO ANYTHING.\u201d", ["harry", "ron"]),
      a("B", "Read it 14 times looking for clues.", ["hermione", "snape"]),
      a("C", "Burn the evidence.", ["draco", "sirius"]),
      a("D", "Immediately tell my best friend.", ["dobby", "hagrid"]),
      a("E", "\u201cFinally. Someone noticed.\u201d", ["luna", "dumbledore"]),
    ],
  },
  {
    prompt: "🧪 Professor Snape says: \u201cExplain yourself.\u201d",
    answers: [
      a("A", "\u201cI genuinely have no idea.\u201d", ["ron", "luna"]),
      a("B", "\u201cI have a 7-point explanation prepared.\u201d", ["hermione", "dumbledore"]),
      a("C", "\u201cIt wasn't me.\u201d", ["harry", "draco"]),
      a("D", "\u201cTechnically, I can explain.\u201d", ["sirius", "snape"]),
      a("E", "Slowly back away.", ["dobby", "hagrid"]),
    ],
  },
  {
    prompt: "🍗 You're at the Great Hall and someone takes food from your plate.",
    answers: [
      a("A", "Give them some more.", ["dobby", "hagrid"]),
      a("B", "\u201cExcuse me???\u201d", ["ron", "draco"]),
      a("C", "Take twice as much from their plate later.", ["sirius", "harry"]),
      a("D", "Pretend I didn't notice but remember it forever.", ["snape", "luna"]),
      a("E", "Ask them if they're still hungry.", ["hermione", "dumbledore"]),
    ],
  },
  {
    prompt:
      "🧙‍♂️ Dumbledore announces: \u201cTonight, we have an extremely important mission.\u201d",
    answers: [
      a("A", "FINALLY. ADVENTURE.", ["harry", "sirius"]),
      a("B", "What are the risks? What are the objectives? Who authorized this?", [
        "hermione",
        "dumbledore",
      ]),
      a("C", "\u201cDo we get snacks?\u201d", ["ron", "hagrid"]),
      a("D", "\u201cAbsolutely not.\u201d", ["draco", "snape"]),
      a("E", "Already putting on my shoes.", ["dobby", "luna"]),
    ],
  },
  {
    prompt:
      "🐍 You accidentally walk into the wrong common room. You realize it is Slytherin.",
    answers: [
      a("A", "Apologize and leave immediately.", ["hermione", "dobby"]),
      a("B", "Pretend I belong there.", ["draco", "sirius"]),
      a("C", "Start looking around because I'm already here.", ["luna", "harry"]),
      a("D", "\u201cWell... this is awkward.\u201d", ["ron", "hagrid"]),
      a("E", "Befriend someone before leaving.", ["dumbledore", "snape"]),
    ],
  },
  {
    prompt:
      "🪄 You find a mysterious object in an abandoned Hogwarts corridor. It is glowing.",
    answers: [
      a("A", "Touch it. Obviously.", ["harry", "sirius"]),
      a("B", "DO NOT TOUCH THAT.", ["hermione", "snape"]),
      a("C", "Take a picture first.", ["luna", "ron"]),
      a("D", "Find a professor.", ["dobby", "dumbledore"]),
      a("E", "Bring it back to my dorm.", ["draco", "hagrid"]),
    ],
  },
  {
    prompt:
      "🧹 You're told you have to spend an entire day with someone you absolutely cannot stand.",
    answers: [
      a("A", "Try to be nice.", ["dobby", "hermione"]),
      a("B", "Challenge them to something.", ["sirius", "draco"]),
      a("C", "Avoid them at all costs.", ["snape", "luna"]),
      a("D", "Become their friend somehow.", ["hagrid", "ron"]),
      a("E", "Annoy them until they leave.", ["harry", "dumbledore"]),
    ],
  },
  {
    prompt:
      "⚡ FINAL QUESTION — You're standing in front of Hogwarts castle. The Sorting Hat is placed on your head. It whispers: \u201cI know exactly what you are.\u201d",
    answers: [
      a("A", "\u201cPlease don't embarrass me.\u201d", ["ron", "dobby"]),
      a("B", "\u201cTake your time.\u201d", ["luna", "dumbledore"]),
      a("C", "\u201cYou better get this right.\u201d", ["draco", "snape"]),
      a("D", "\u201cWhat do you think I am?\u201d", ["harry", "hagrid"]),
      a("E", "\u201cCan I choose?\u201d", ["hermione", "sirius"]),
    ],
  },
];

export const tieBreakerPrompt =
  "🕯️ One last thing. It is midnight. Something is definitely moving in the corridor. What is your instinct?";

export const tieBreakerAnswers = [
  { label: "A", text: "Investigate immediately. No plan. No backup." },
  { label: "B", text: "Write down exactly what I saw, with timestamps." },
  { label: "C", text: "Go back to bed. That's tomorrow's problem." },
  { label: "D", text: "Say hello to it. It might be lonely." },
];

/** Deterministic scoring: every answer awards +1 to two characters. */
export function scoreAnswers(picks: number[]): Record<CharacterId, number> {
  const scores = {
    harry: 0,
    hermione: 0,
    ron: 0,
    draco: 0,
    dumbledore: 0,
    snape: 0,
    dobby: 0,
    hagrid: 0,
    luna: 0,
    sirius: 0,
  } as Record<CharacterId, number>;

  picks.forEach((pick, index) => {
    const answer = questions[index]?.answers[pick];
    if (!answer) return;
    scores[answer.points[0]] += 1;
    scores[answer.points[1]] += 1;
  });

  return scores;
}

/** All characters sharing the top score (length > 1 means a tie). */
export function topCharacters(scores: Record<CharacterId, number>): CharacterId[] {
  const entries = Object.entries(scores) as [CharacterId, number][];
  const best = Math.max(...entries.map(([, value]) => value));
  return entries.filter(([, value]) => value === best).map(([id]) => id);
}

/** Tie-breaker: pick the tied character using the extra answer, deterministically. */
export function resolveTie(tied: CharacterId[], tieAnswer: number): CharacterId {
  return tied[tieAnswer % tied.length]!;
}
