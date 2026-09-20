import { SnackAnalysisRecord } from '../types';

const STORAGE_KEY = 'useless_food_inc_history_v3';

const INITIAL_HISTORY: SnackAnalysisRecord[] = [
  {
    id: 'seed-1',
    timestamp: Date.now() - 1000 * 60 * 45,
    type: 'tholi',
    score: 84,
    verdictTitle: 'Prime Snack Era',
    verdictDesc: 'Peak structural stability and sweetness. Consume within the next 14 minutes.',
    footer: 'Optimal yellow balance certified.',
    badgeText: 'Peak Perfection',
    badgeClass: 'badge',
    fileName: 'curved_golden_delight.jpg'
  },
  {
    id: 'seed-2',
    timestamp: Date.now() - 1000 * 60 * 180,
    type: 'kadi',
    score: 18,
    verdictTitle: 'Chai Sludge / RIP',
    verdictDesc: 'Bro ask your mom before you drink that... or grab a spoon. Your biscuit is currently forming sedimentary layers at the bottom.',
    footer: 'CRITICAL FAILURE: 0% structural cohesion left.',
    badgeText: 'Sedimentary Rock',
    badgeClass: 'roast-badge',
    fileName: 'submerged_parle_g.jpg'
  }
];

export function getHistory(): SnackAnalysisRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HISTORY));
      return INITIAL_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_HISTORY;
  } catch (err) {
    console.warn('Failed to load snack history from localStorage:', err);
    return INITIAL_HISTORY;
  }
}

export function saveHistoryRecord(record: SnackAnalysisRecord): SnackAnalysisRecord[] {
  try {
    const existing = getHistory();
    // Keep up to 100 entries to manage local storage size
    const updated = [record, ...existing.filter(item => item.id !== record.id)].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save snack record to storage:', err);
    // If quota exceeded, trim imageSrc
    try {
      const existing = getHistory();
      const lightweightRecord = { ...record, imageSrc: undefined };
      const updated = [lightweightRecord, ...existing.slice(0, 30)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [record];
    }
  }
}

export function deleteHistoryRecord(id: string): SnackAnalysisRecord[] {
  try {
    const existing = getHistory();
    const filtered = existing.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete history item:', err);
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}

export function toggleFavorite(id: string): SnackAnalysisRecord[] {
  try {
    const existing = getHistory();
    const updated = existing.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to toggle favorite:', err);
    return getHistory();
  }
}
