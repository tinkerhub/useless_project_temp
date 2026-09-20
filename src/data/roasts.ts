import { KadiRoast, BiscuitPreset } from '../types';

export const KADI_ROASTS: KadiRoast[] = [
  {
    minScore: 0,
    maxScore: 20,
    title: "Chai Sludge / RIP",
    desc: "Bro ask your mom before you drink that... or grab a spoon. Your biscuit is currently forming sedimentary layers at the bottom.",
    footer: "CRITICAL FAILURE: 0% structural cohesion left.",
    badgeText: "Sedimentary Rock",
    badgeClass: "roast-badge"
  },
  {
    minScore: 21,
    maxScore: 45,
    title: "High Risk Dunk",
    desc: "That biscuit has a 1.2-second lifespan before it surrenders to gravity. Dunk at your own psychological peril.",
    footer: "Soggy crumb warning active.",
    badgeText: "Dunk Hazard",
    badgeClass: "roast-badge"
  },
  {
    minScore: 46,
    maxScore: 75,
    title: "Mid-Tier Chai Setup",
    desc: "Passable tea color, average biscuit resistance. Not a catastrophe, but definitely not worthy of bragging.",
    footer: "Standard 2-second dunk limit recommended.",
    badgeText: "Average Dunk",
    badgeClass: "badge-default"
  },
  {
    minScore: 76,
    maxScore: 100,
    title: "Master Dunker Status",
    desc: "Optimal biscuit tension and chai temperature. Proceed with a confident 3-second submersion.",
    footer: "High crumb resilience certified.",
    badgeText: "Dunk Ready",
    badgeClass: "badge-default"
  }
];

export const BISCUIT_PRESETS: BiscuitPreset[] = [
  {
    id: 'parle-g',
    name: 'Parle-G',
    maxDunkSeconds: 1.4,
    durability: 'Instant Sludge',
    flavorRoast: 'Dissolves at the mere sight of hot liquid. You blink, it belongs to the cup now.',
    accentColor: '#fab387'
  },
  {
    id: 'marie',
    name: 'Marie Gold',
    maxDunkSeconds: 3.2,
    durability: 'Medium',
    flavorRoast: 'A stoic tea companion. Cardboard flavor, but holds together like an Olympic diver.',
    accentColor: '#f9e2af'
  },
  {
    id: 'rusk',
    name: 'Cake Rusk',
    maxDunkSeconds: 6.5,
    durability: 'Extreme',
    flavorRoast: 'Literally kiln-baked masonry. Could survive a nuclear chai fallout.',
    accentColor: '#fab387'
  },
  {
    id: 'bourbon',
    name: 'Bourbon Chocolate',
    maxDunkSeconds: 2.2,
    durability: 'Fragile',
    flavorRoast: 'Cream layer acts as thermal lubricant; halves structural lifespan without notice.',
    accentColor: '#cba6f7'
  },
  {
    id: 'nice',
    name: 'Coconut Nice',
    maxDunkSeconds: 2.0,
    durability: 'Fragile',
    flavorRoast: 'Sugar crystal armor provides false sense of security before rapid catastrophic delamination.',
    accentColor: '#a6e3a1'
  }
];

export const BANANA_PRESETS = [
  {
    name: 'Neon Stick (Unripe)',
    hint: 'green_unripe_raw.jpg',
    category: 'green',
    description: 'Fresh off the branch, rigid enough to hammer drywall nails.'
  },
  {
    name: 'Prime Golden (Peak)',
    hint: 'golden_yellow_prime.jpg',
    category: 'yellow',
    description: 'Flawless curvature, zero black freckles, prime potassium window.'
  },
  {
    name: 'Sugar Freckles (Leopard)',
    hint: 'sweet_spotted_cheetah.jpg',
    category: 'spotted',
    description: 'Ripened to maximum sweetness. Needs consumption before dusk.'
  },
  {
    name: 'Dark Fossil (Compost)',
    hint: 'black_dark_overripe_fossil.jpg',
    category: 'biohazard',
    description: 'Blackened peel, primordial goo, smells like fermentation and regret.'
  }
];

export const CHAI_PRESETS = [
  {
    name: 'Parle-G Hazard',
    hint: 'wet_drown_soggy_parleg.jpg',
    description: 'Extremely hot cutting chai + thin glucose biscuit.'
  },
  {
    name: 'Classic Marie Setup',
    hint: 'marie_biscuit_warm_chai.jpg',
    description: 'Standard ginger tea + dry Marie circle.'
  },
  {
    name: 'Double Dunk Mastery',
    hint: 'crispy_rusk_tea_perfection.jpg',
    description: 'Hardened wheat rusk primed for maximum liquid absorption.'
  },
  {
    name: 'Sludge Catastrophe',
    hint: 'black_broke_sludge_bottom.jpg',
    description: 'Forgotten biscuit resting at bottom of cup since 20 minutes ago.'
  }
];
