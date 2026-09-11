export const typingSample =
    "Sphinx of black quartz, judge my words and tell me what I fear.";

export interface TypingMetrics {
    keys: number;
    correctChars: number;
    accuracy: number;
    wpm: number;
    backspaces: number;
    hesitationSeconds: number;
    aggression: number;
    aggressionLabel: "LOW" | "MEDIUM" | "HIGH";
    durationSeconds: number;
    confidence: number;
}

export interface TypingVerdict extends TypingMetrics {
    conclusion: string;
}

export interface TypingConclusion {
    id: string;
    matches: (metrics: TypingMetrics) => boolean;
    lines: string[];
}

export const typingConclusions: TypingConclusion[] = [
    {
        id: "high-wpm",
        matches: (m) => m.wpm >= 60,
        lines: [
            "You are the kind of person who opens seventeen tabs and uses none of them.",
            "You type like you're being chased, and honestly, I respect the stamina.",
            "Speed is not the same as progress, and you will never learn this.",
        ],
    },
    {
        id: "high-accuracy",
        matches: (m) => m.accuracy >= 97,
        lines: [
            "You are so precise it is frankly a little unsettling.",
            "You would make an excellent proofreader and an exhausting friend.",
            "Your typos fear you. They know better than to appear.",
        ],
    },
    {
        id: "many-backspaces",
        matches: (m) =>
            m.backspaces >= 15 ||
            (m.keys > 0 && m.backspaces > m.keys * 0.1),
        lines: [
            "You regret decisions in real time, and I respect the commitment to quality control.",
            "You are the kind of person who writes a message, deletes it, and sends one three times shorter.",
            "Your backspace key is filing for emotional damages.",
        ],
    },
    {
        id: "long-hesitations",
        matches: (m) => m.hesitationSeconds >= 3,
        lines: [
            "You can turn a two-sentence message into a twenty-minute ordeal.",
            "You type, then think, then worry about what thinking does to your typing.",
            "Every pause is a small crisis you have chosen not to explain.",
        ],
    },
    {
        id: "high-aggression",
        matches: (m) => m.aggression >= 66,
        lines: [
            "You hammer the keyboard like it owes you money.",
            "You are the person who types in caps lock but sends in lowercase, cowardly but effective.",
            "Your keyboard is not a keyboard. It is a punching bag with letters.",
        ],
    },
    {
        id: "low-wpm",
        matches: (m) => m.wpm < 20,
        lines: [
            "You are probably still thinking about what you wanted to say yesterday.",
            "Speed is not everything. I checked. It's almost everything.",
            "You type the way a snail would if the snail also had doubts.",
        ],
    },
    {
        id: "low-accuracy",
        matches: (m) => m.accuracy < 80,
        lines: [
            "Your keyboard should probably be preserved in a museum as evidence.",
            "You don't make typos. You make contributions to interpretive text.",
            "Spell-check has given up on you, and so have I. They've accepted that.",
        ],
    },
    {
        id: "generic",
        matches: () => true,
        lines: [
            "You are exactly as mysterious as a person who types things.",
            "I have analyzed your typing deeply and concluded: you type.",
            "Verdict inconclusive. You are probably fine. Almost certainly not.",
        ],
    },
];