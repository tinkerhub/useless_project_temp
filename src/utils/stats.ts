const STORAGE_KEY = "uselessos-stats";

export type ToolStats = Record<string, number>;

export function readStats(): ToolStats {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return {};
        }

        return JSON.parse(raw) as ToolStats;
    } catch {
        return {};
    }
}

export function recordOpen(toolId: string): ToolStats {
    const next = readStats();

    next[toolId] = (next[toolId] ?? 0) + 1;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    return next;
}