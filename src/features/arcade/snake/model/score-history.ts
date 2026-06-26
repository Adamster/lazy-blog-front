/**
 * Snake score history — a localStorage log of every finished run's final score
 * (per browser), the data behind the stats band's `// RECENT RUNS` sparkline.
 * This is the ONE arcade store still on localStorage: the backend exposes the
 * viewer's best / games-played / rank but NO per-run history SERIES, so the
 * recent-runs sparkline has no endpoint to read. A versioned key, a buffer cap,
 * and every access wrapped in try/catch so a disabled / full localStorage never
 * crashes the game (it just falls back to an in-memory empty log for the session).
 */

import type { HistoryPoint } from "./types";

// Bumped v1 → v2 to drop the old seed-polluted logs. v1 seeded every browser's
// log with a fake SEED_HISTORY and real runs appended onto it, so the sparkline
// showed games (up to 940) that never happened and never made the leaderboard.
// v2 starts clean: real runs only, no fabricated data.
const KEY_HISTORY = "notlazy_snake_history_v2";

/** How many runs we persist (a healthy buffer; the band shows the last N). */
export const HISTORY_CAP = 50;

/** How many recent runs the stats-band sparkline plots (newest on the right). */
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

/**
 * Read the full persisted score log (oldest → newest). Returns an EMPTY log when
 * nothing is stored — the chart renders a flat zero point until the first real
 * run lands, never fabricated data (the leaderboard and the sparkline now agree).
 */
export function loadHistory(): number[] {
  try {
    return parseHistory(localStorage.getItem(KEY_HISTORY));
  } catch {
    return [];
  }
}

/**
 * Append a finished run's score, cap the buffer to the most recent
 * {@link HISTORY_CAP}, persist (best-effort), and return the new log. Pass the
 * PREVIOUS log so the caller controls reads (record-once on game over) — we
 * never re-read here, so a re-render can't double-count.
 */
export function recordScore(prev: number[], score: number): number[] {
  const next = [...prev, score].slice(-HISTORY_CAP);
  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(next));
  } catch {
    // ignore — log stays in memory for this session
  }
  return next;
}

/**
 * Derive the sparkline series for the band: the last {@link HISTORY_RECENT}
 * runs (oldest → newest, newest on the right), labelled by play order (`#1…`).
 * An empty log yields a single zero point so the chart renders a flat line
 * (matching the profile's empty-activity behaviour) rather than nothing.
 */
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
