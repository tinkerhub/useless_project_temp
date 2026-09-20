export type SnackType = 'tholi' | 'kadi';

export interface SnackAnalysisRecord {
  id: string;
  timestamp: number;
  type: SnackType;
  score: number;
  verdictTitle: string;
  verdictDesc: string;
  footer: string;
  badgeText: string;
  badgeClass: string;
  imageSrc?: string;
  fileName?: string;
  snackSubtype?: string;
  isFavorite?: boolean;
}

export interface KadiRoast {
  minScore: number;
  maxScore: number;
  title: string;
  desc: string;
  footer: string;
  badgeText: string;
  badgeClass: string;
}

export interface TholiRoast {
  category: 'green' | 'yellow' | 'spotted' | 'overripe' | 'biohazard';
  minScore: number;
  maxScore: number;
  title: string;
  desc: string;
  footer: string;
  badgeText: string;
  badgeClass: string;
}

export interface BiscuitPreset {
  id: string;
  name: string;
  maxDunkSeconds: number;
  durability: 'Extreme' | 'High' | 'Medium' | 'Fragile' | 'Instant Sludge';
  flavorRoast: string;
  accentColor: string;
}
