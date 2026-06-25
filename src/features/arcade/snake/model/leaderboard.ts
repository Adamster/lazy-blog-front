import type { RankedRow, ScoreRow } from "./types";

/**
 * Snake leaderboard — a localStorage high-score board (per browser). This is the
 * MVP the designer shipped; a real cross-user backend board is a noted
 * follow-up (it'd need a `POST /arcade/scores` + a fetch on mount). All access
 * is wrapped in try/catch so a disabled / full localStorage never crashes the
 * game — it just falls back to the in-memory seed.
 */

const KEY_BEST = "notlazy_snake_best_v1";
const KEY_BOARD = "notlazy_snake_board_v1";

/** How many rows we persist / show. */
export const BOARD_SIZE = 10;

/**
 * On-brand deadpan seed handles (the NOT LAZY voice — dev in-jokes + laziness).
 * Reuses the designer's set and adds a few equally-on-voice ones.
 */
export const SEED_BOARD: ScoreRow[] = [
  { name: "@lazy_ela", score: 1280 },
  { name: "@procaffeinate", score: 940 },
  { name: "@null_pointer", score: 760 },
  { name: "@ctrl_alt_defeat", score: 540 },
  { name: "@off_by_one", score: 410 },
  { name: "@semicolon;", score: 300 },
  { name: "@rubber_duck", score: 210 },
  { name: "@404_sleep", score: 120 },
  { name: "@merge_conflict", score: 90 },
  { name: "@todo_later", score: 45 },
];

const numberFmt = new Intl.NumberFormat("en-US");

/**
 * Sort desc, cap to BOARD_SIZE, decorate with padded rank + label — then ALWAYS
 * pad up to exactly BOARD_SIZE rows, filling any unoccupied slot with a muted
 * `··` placeholder + 0 score (so the board never renders short).
 */
export function rankBoard(rows: ScoreRow[]): RankedRow[] {
  const ranked: RankedRow[] = [...rows]
    .sort((a, b) => b.score - a.score)
    .slice(0, BOARD_SIZE)
    .map((row, i) => ({
      ...row,
      rank: String(i + 1).padStart(2, "0"),
      scoreLabel: numberFmt.format(row.score),
    }));
  while (ranked.length < BOARD_SIZE) {
    const i = ranked.length;
    ranked.push({
      name: "··",
      score: 0,
      rank: String(i + 1).padStart(2, "0"),
      scoreLabel: "0",
      empty: true,
    });
  }
  return ranked;
}

export function formatScore(score: number): string {
  return numberFmt.format(score);
}

/** Read persisted best (0 if unset / unreadable). */
export function loadBest(): number {
  try {
    return Number.parseInt(localStorage.getItem(KEY_BEST) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

/** Read the persisted board, falling back to the seed. Never contains `YOU`. */
export function loadBoard(): ScoreRow[] {
  try {
    const raw = localStorage.getItem(KEY_BOARD);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed
          .filter(
            (r): r is ScoreRow =>
              typeof r === "object" &&
              r !== null &&
              typeof (r as ScoreRow).name === "string" &&
              typeof (r as ScoreRow).score === "number"
          )
          .map((r) => ({ name: r.name, score: r.score }));
      }
    }
  } catch {
    // fall through to seed
  }
  return SEED_BOARD.map((r) => ({ ...r }));
}

/** Result of inserting a run into the board. */
export interface SubmitResult {
  /** Board with `YOU` inserted + ranked (for display). */
  ranked: RankedRow[];
  /** New best (persisted). */
  best: number;
  /** Whether this run beat the previous best. */
  isNewBest: boolean;
  /** 1-based rank of `YOU`, or 0 if off the visible board. */
  rank: number;
}

/**
 * Insert a finished run as `YOU`, persist the board (sans `YOU`) + best, and
 * return the ranked board + rank line inputs. Persistence is best-effort.
 */
export function submitScore(
  prevBoard: ScoreRow[],
  prevBest: number,
  score: number
): SubmitResult {
  const best = Math.max(prevBest, score);
  const isNewBest = score > 0 && score > prevBest;

  // Drop any prior `YOU` row, push this run, sort, keep a deep board so a low
  // score can still report a real (if off-screen) rank.
  const withYou: ScoreRow[] = [
    ...prevBoard.filter((r) => !r.you && r.name !== "YOU"),
    { name: "YOU", score, you: true },
  ].sort((a, b) => b.score - a.score);

  const fullRank = withYou.findIndex((r) => r.you) + 1;
  const ranked = rankBoard(withYou);
  // Only surface a rank if YOU made the visible board.
  const rank = ranked.some((r) => r.you) ? fullRank : 0;

  const persisted = withYou.filter((r) => !r.you).slice(0, BOARD_SIZE);
  try {
    localStorage.setItem(KEY_BEST, String(best));
    localStorage.setItem(KEY_BOARD, JSON.stringify(persisted));
  } catch {
    // ignore — board stays in memory for this session
  }

  return { ranked, best, isNewBest, rank };
}

/** Wipe the persisted board + best back to the seed. */
export function clearBoard(): RankedRow[] {
  try {
    localStorage.removeItem(KEY_BOARD);
    localStorage.removeItem(KEY_BEST);
  } catch {
    // ignore
  }
  return rankBoard(SEED_BOARD.map((r) => ({ ...r })));
}
