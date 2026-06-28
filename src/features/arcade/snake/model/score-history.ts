/**
 * Snake score history — a localStorage log of finished runs' scores (the stats
 * band's `// RECENT RUNS` sparkline). The one arcade store still on localStorage:
 * the backend has best/games/rank but NO per-run series. Versioned key + cap +
 * try/catch so a disabled/full localStorage never crashes the game.
 */

import type { HistoryPoint } from "./types";

// v2: dropped the old v1 seed-polluted logs (v1 seeded a fake SEED_HISTORY, so the
// sparkline showed games up to 940 that never happened). v2 = real runs only.
const KEY_HISTORY = "notlazy_snake_history_v2";

export const HISTORY_CAP = 50;

export const HISTORY_RECENT = 20;

function parseHistory(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (n): n is number => typeof n === "number" && Number.isFinite(n)
      );
    }
  } catch {
    // fall through to empty
  }
  return [];
}

/** Read the persisted score log (oldest → newest); empty when nothing is stored. */
export function loadHistory(): number[] {
  try {
    return parseHistory(localStorage.getItem(KEY_HISTORY));
  } catch {
    return [];
  }
}

/** Append a run's score, cap to {@link HISTORY_CAP}, persist (best-effort).
 *  Pass the PREVIOUS log (we never re-read here) so a re-render can't double-count. */
export function recordScore(prev: number[], score: number): number[] {
  const next = [...prev, score].slice(-HISTORY_CAP);
  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(next));
  } catch {
    // ignore — log stays in memory for this session
  }
  return next;
}

/** Last {@link HISTORY_RECENT} runs as sparkline points (newest on the right).
 *  Empty log → a single zero point so the chart shows a flat line, not nothing. */
export function recentSeries(
  history: number[],
  recent = HISTORY_RECENT
): HistoryPoint[] {
  const slice = history.slice(-recent);
  if (slice.length === 0) return [{ label: "#1", count: 0 }];
  // Number runs from the oldest VISIBLE run so the rightmost is the latest.
  const startIndex = Math.max(0, history.length - slice.length);
  return slice.map((score, i) => ({
    label: `#${startIndex + i + 1}`,
    count: score,
  }));
}
