// src/data/typingData.ts
var typingSample = "Sphinx of black quartz, judge my words and tell me what I fear.";
var typingConclusions = [
  {
    id: "high-wpm",
    matches: (m) => m.wpm >= 60,
    lines: [
      "You are the kind of person who opens seventeen tabs and uses none of them.",
      "You type like you're being chased, and honestly, I respect the stamina.",
      "Speed is not the same as progress, and you will never learn this."
    ]
  },
  {
    id: "high-accuracy",
    matches: (m) => m.accuracy >= 97,
    lines: [
      "You are so precise it is frankly a little unsettling.",
      "You would make an excellent proofreader and an exhausting friend.",
      "Your typos fear you. They know better than to appear."
    ]
  },
  {
    id: "many-backspaces",
    matches: (m) => m.backspaces >= 15 || m.keys > 0 && m.backspaces > m.keys * 0.1,
    lines: [
      "You regret decisions in real time, and I respect the commitment to quality control.",
      "You are the kind of person who writes a message, deletes it, and sends one three times shorter.",
      "Your backspace key is filing for emotional damages."
    ]
  },
  {
    id: "long-hesitations",
    matches: (m) => m.hesitationSeconds >= 3,
    lines: [
      "You can turn a two-sentence message into a twenty-minute ordeal.",
      "You type, then think, then worry about what thinking does to your typing.",
      "Every pause is a small crisis you have chosen not to explain."
    ]
  },
  {
    id: "high-aggression",
    matches: (m) => m.aggression >= 66,
    lines: [
      "You hammer the keyboard like it owes you money.",
      "You are the person who types in caps lock but sends in lowercase, cowardly but effective.",
      "Your keyboard is not a keyboard. It is a punching bag with letters."
    ]
  },
  {
    id: "low-wpm",
    matches: (m) => m.wpm < 20,
    lines: [
      "You are probably still thinking about what you wanted to say yesterday.",
      "Speed is not everything. I checked. It's almost everything.",
      "You type the way a snail would if the snail also had doubts."
    ]
  },
  {
    id: "low-accuracy",
    matches: (m) => m.accuracy < 80,
    lines: [
      "Your keyboard should probably be preserved in a museum as evidence.",
      "You don't make typos. You make contributions to interpretive text.",
      "Spell-check has given up on you, and so have I. They've accepted that."
    ]
  },
  {
    id: "generic",
    matches: () => true,
    lines: [
      "You are exactly as mysterious as a person who types things.",
      "I have analyzed your typing deeply and concluded: you type.",
      "Verdict inconclusive. You are probably fine. Almost certainly not."
    ]
  }
];

// src/utils/typingAnalysis.ts
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function average(values) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function standardDeviation(values) {
  if (values.length < 2) {
    return 0;
  }
  const mean = average(values);
  const variance = values.reduce(
    (sum, value) => sum + (value - mean) ** 2,
    0
  ) / values.length;
  return Math.sqrt(variance);
}
function pickLine(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}
function analyzeTyping(session) {
  const { value, keyTimes, backspaces, caps } = session;
  const sample = typingSample;
  let keys = keyTimes.length;
  if (keys === 0 && session.endedAt > session.startedAt) {
    keys = 1;
  }
  let correctChars = 0;
  for (let i = 0; i < value.length && i < sample.length; i++) {
    if (value[i] === sample[i]) {
      correctChars += 1;
    }
  }
  const accuracy = sample.length > 0 ? clamp(
    correctChars / sample.length * 100,
    0,
    100
  ) : 0;
  const durationSeconds = Math.max(
    session.endedAt - session.startedAt,
    0
  ) / 1e3;
  const wpm = durationSeconds > 0 ? Math.round(
    correctChars / 5 / (durationSeconds / 60)
  ) : 0;
  const gaps = [];
  for (let i = 1; i < keyTimes.length; i++) {
    gaps.push(keyTimes[i] - keyTimes[i - 1]);
  }
  const hesitationSeconds = gaps.length > 0 ? gaps.filter((gap) => gap > 600).reduce((sum, gap) => sum + gap, 0) / 1e3 : 0;
  const cv = gaps.length > 1 ? standardDeviation(gaps) / average(gaps) : 0;
  const capsFrac = keys > 0 ? caps / keys : 0;
  const delFrac = keys > 0 ? backspaces / keys : 0;
  const rapidFrac = gaps.length > 0 ? gaps.filter((gap) => gap < 150).length / gaps.length : 0;
  const aggression = Math.round(
    100 * (0.35 * clamp(cv * 2.5, 0, 1) + 0.25 * clamp(capsFrac * 8, 0, 1) + 0.25 * clamp(delFrac * 3, 0, 1) + 0.15 * clamp(rapidFrac * 4, 0, 1))
  );
  const aggressionLabel = aggression >= 66 ? "HIGH" : aggression >= 33 ? "MEDIUM" : "LOW";
  const confidence = Math.round(
    clamp(48 + keys * 0.24, 48, 96) + (Math.random() * 6 - 3)
  );
  const metrics = {
    keys,
    correctChars,
    accuracy: Math.round(accuracy),
    wpm,
    backspaces,
    hesitationSeconds: Math.round(
      hesitationSeconds * 10
    ) / 10,
    aggression,
    aggressionLabel,
    durationSeconds: Math.round(durationSeconds),
    confidence
  };
  const matchingConclusion = typingConclusions.find(
    (def) => def.matches(metrics)
  ) ?? typingConclusions.find((def) => def.id === "generic");
  return {
    ...metrics,
    conclusion: pickLine(
      matchingConclusion?.lines ?? []
    )
  };
}
export {
  analyzeTyping
};
