/**
 * 2048 score history — a localStorage log of finished runs' scores (the stats
 * band's recent-runs sparkline). Same rationale as Snake: the backend exposes
 * best/games/rank but NO per-run series, so the sparkline reads localStorage.
 * Versioned key + cap + try/catch so a disabled/full localStorage never crashes.
 */

import type { HistoryPoint } from "./types";

const KEY_HISTORY = "notlazy_2048_history_v1";

/** Per-identity storage key — the log is scoped to the signed-in username (or
 *  the guest bucket) so identities on a shared device never mix stats. */
const storageKey = (scope: string) => `${KEY_HISTORY}:${scope}`;

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
export function loadHistory(scope: string): number[] {
  try {
    return parseHistory(localStorage.getItem(storageKey(scope)));
  } catch {
    return [];
  }
}

/** Append a run's score, cap to {@link HISTORY_CAP}, persist (best-effort). Pass the
 *  PREVIOUS log (never re-read here) so a re-render can't double-count. */
export function recordScore(
  scope: string,
  prev: number[],
  score: number
): number[] {
  const next = [...prev, score].slice(-HISTORY_CAP);
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(next));
  } catch {
    // ignore — log stays in memory for this session
  }
  return next;
}

/** Last {@link HISTORY_RECENT} runs as sparkline points (newest on the right). Empty
 *  log → a single zero point so the chart shows a flat line, not nothing. */
export function recentSeries(
  history: number[],
  recent = HISTORY_RECENT
): HistoryPoint[] {
  const slice = history.slice(-recent);
  if (slice.length === 0) return [{ label: "#1", count: 0 }];
  const startIndex = Math.max(0, history.length - slice.length);
  return slice.map((score, i) => ({
    label: `#${startIndex + i + 1}`,
    count: score,
  }));
}
