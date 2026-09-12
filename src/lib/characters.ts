import type { CharacterId } from "./quiz-data";

export type CharacterResult = {
  id: CharacterId;
  name: string;
  emoji: string;
  diagnosis: string;
  description: string;
  stats: { label: string; value: string }[];
  roast: string;
  power: string;
  weakness: string;
  survival: string;
  uselessness: string;
};

export const characters: Record<CharacterId, CharacterResult> = {
  harry: {
    id: "harry",
    name: "Harry Potter",
    emoji: "⚡",
    diagnosis: "Main Character Syndrome",
    description:
      "You have absolutely no idea what's happening, but somehow you're always standing in the middle of it.",
    stats: [
      { label: "Main Character Energy", value: "99%" },
      { label: "Problems Attracted", value: "103%" },
      { label: "Peaceful Life", value: "4%" },
      { label: "Dramatic Entrances", value: "87%" },
      { label: "Knowing What's Going On", value: "31%" },
    ],
    roast: "You didn't choose the plot. The plot chose you.",
    power: "Accidentally becoming the chosen one.",
    weakness: "Thinking \u201cI'll deal with it\u201d is a strategy.",
    survival: "67%",
    uselessness: "78/100",
  },
  hermione: {
    id: "hermione",
    name: "Hermione Granger",
    emoji: "📚",
    diagnosis: "Chronic Over-Preparation",
    description: "You came prepared for an exam nobody told you existed.",
    stats: [
      { label: "Knowledge", value: "99%" },
      { label: "Correcting People", value: "94%" },
      { label: "Patience", value: "17%" },
      { label: "Overthinking", value: "91%" },
      { label: "Tolerance for Group-Project Idiots", value: "-12%" },
    ],
    roast: "You could simply relax. You have chosen not to.",
    power: "Being right and having receipts.",
    weakness: "People saying \u201cI didn't study but I'll probably pass.\u201d",
    survival: "93%",
    uselessness: "41/100",
  },
  ron: {
    id: "ron",
    name: "Ron Weasley",
    emoji: "🍗",
    diagnosis: "Severe Snack Dependency",
    description:
      "You may not know what's happening, but you're coming along anyway.",
    stats: [
      { label: "Hunger", value: "114%" },
      { label: "Loyalty", value: "96%" },
      { label: "Bravery", value: "81%" },
      { label: "Understanding What's Happening", value: "38%" },
      { label: "Emergency Snack Detection", value: "100%" },
    ],
    roast: "Your survival strategy appears to be following your friends.",
    power: "Being there when it matters.",
    weakness: "An empty stomach.",
    survival: "71%",
    uselessness: "84/100",
  },
  draco: {
    id: "draco",
    name: "Draco Malfoy",
    emoji: "💅",
    diagnosis: "Terminal Confidence",
    description:
      "You could probably solve the problem. But complaining about it first is more fun.",
    stats: [
      { label: "Confidence", value: "97%" },
      { label: "Hair Maintenance", value: "108%" },
      { label: "Actual Plan", value: "31%" },
      { label: "Judging People", value: "100%" },
      { label: "Saying \u201cMy Father...\u201d", value: "89%" },
    ],
    roast: "Your confidence entered the room three minutes before you did.",
    power: "Making everything look like someone else's problem.",
    weakness: "People who don't take you seriously.",
    survival: "76%",
    uselessness: "89/100",
  },
  dumbledore: {
    id: "dumbledore",
    name: "Albus Dumbledore",
    emoji: "🔮",
    diagnosis: "Mysterious Adult Syndrome",
    description:
      "You knew the answer three hours ago. You simply chose not to tell anyone.",
    stats: [
      { label: "Wisdom", value: "99%" },
      { label: "Mysterious Statements", value: "100%" },
      { label: "Explaining the Plan", value: "7%" },
      { label: "Knowing More Than You Admit", value: "100%" },
      { label: "Questionable Decisions", value: "82%" },
    ],
    roast: "You could have explained the plan. You chose ✨mystery✨.",
    power: "Knowing absolutely everything while explaining absolutely nothing.",
    weakness: "Actually communicating.",
    survival: "98%",
    uselessness: "91/100",
  },
  snape: {
    id: "snape",
    name: "Severus Snape",
    emoji: "🧪",
    diagnosis: "Chronic Disappointment",
    description:
      "You have perfected the art of saying nothing while making it extremely clear how you feel.",
    stats: [
      { label: "Patience", value: "2%" },
      { label: "Judgement", value: "100%" },
      { label: "Dramatic Pauses", value: "97%" },
      { label: "Smiling", value: "Unavailable" },
      { label: "Intimidation", value: "101%" },
    ],
    roast: "You don't hate everyone. You just haven't found a reason not to.",
    power: "Making one facial expression communicate an entire paragraph.",
    weakness: "People being happy around you.",
    survival: "94%",
    uselessness: "73/100",
  },
  dobby: {
    id: "dobby",
    name: "Dobby",
    emoji: "🧦",
    diagnosis: "Aggressive Loyalty",
    description:
      "Nobody requested your help. You have already provided it, twice, dramatically.",
    stats: [
      { label: "Loyalty", value: "1000%" },
      { label: "Chaos", value: "91%" },
      { label: "Helping People", value: "98%" },
      { label: "Following Instructions", value: "12%" },
      { label: "Dramatic Sacrifices", value: "107%" },
    ],
    roast: "Nobody asked you to save them. You did it anyway.",
    power: "Unreasonable dedication.",
    weakness: "The word \u201cfriend.\u201d",
    survival: "64%",
    uselessness: "96/100",
  },
  hagrid: {
    id: "hagrid",
    name: "Rubeus Hagrid",
    emoji: "🐉",
    diagnosis: "Severe Creature Attachment",
    description:
      "Every dangerous creature within a five-mile radius considers you family.",
    stats: [
      { label: "Kindness", value: "100%" },
      { label: "Creature Friendship", value: "99%" },
      { label: "Accidentally Dangerous Animals", value: "87%" },
      { label: "Volume Control", value: "12%" },
      { label: "Keeping Secrets", value: "3%" },
    ],
    roast: "You saw a terrifying creature and thought: \u201cAwwww.\u201d",
    power: "Making friends with things everyone else is running away from.",
    weakness: "\u201cIt won't bite.\u201d",
    survival: "58%",
    uselessness: "97/100",
  },
  luna: {
    id: "luna",
    name: "Luna Lovegood",
    emoji: "🌙",
    diagnosis: "Advanced Weirdness",
    description:
      "You are operating on a frequency the rest of the castle cannot receive.",
    stats: [
      { label: "Imagination", value: "100%" },
      { label: "Normality", value: "8%" },
      { label: "Random Facts", value: "94%" },
      { label: "Caring What People Think", value: "3%" },
      { label: "Believing Things Nobody Else Does", value: "Classified" },
    ],
    roast: "Nobody understands your thought process. Including you.",
    power: "Being completely comfortable being yourself.",
    weakness: "Reality.",
    survival: "82%",
    uselessness: "95/100",
  },
  sirius: {
    id: "sirius",
    name: "Sirius Black",
    emoji: "🐾",
    diagnosis: "Chronic Chaos",
    description:
      "You treat every ordinary evening as an opportunity for an unnecessary event.",
    stats: [
      { label: "Chaos", value: "94%" },
      { label: "Loyalty", value: "97%" },
      { label: "Ability to Behave", value: "11%" },
      { label: "Dramatic Entrances", value: "106%" },
      { label: "Bad Decisions", value: "89%" },
    ],
    roast:
      "You were given one simple instruction. You immediately improved it by making it worse.",
    power: "Turning absolutely nothing into an event.",
    weakness: "Being told to behave.",
    survival: "69%",
    uselessness: "98/100",
  },
};

export const finalReport = [
  { label: "Magical competence", value: "76%" },
  { label: "Common sense", value: "41%" },
  { label: "Dramatic entrances", value: "89%" },
  { label: "Ability to avoid trouble", value: "13%" },
  { label: "Chance of surviving Hogwarts", value: "68%" },
  { label: "Uselessness", value: "97%" },
];
