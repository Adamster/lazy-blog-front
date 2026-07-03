"use client";

export interface BoardEyebrowStat {
  label: string;
  value: string | number;
}

/** Unboxed `// LABEL VALUE · LABEL VALUE` data line sitting directly above a
 *  board's canvas — one leading `//`, multiple stats joined by a centered dot.
 *  The line itself is the muted data-label tier; each VALUE is bold and flips
 *  to accent once non-zero (the stat sign rule — these counters never go
 *  negative). Holds each game's overflow stats that don't fit the universal
 *  SCORE/BEST/chart {@link StatsBand} (2048's Moves, Tetris's Lines + Level,
 *  Snake-classic's Eaten). */
export function BoardEyebrow({ stats }: { stats: BoardEyebrowStat[] }) {
  return (
    <div className="pb-3.5 text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
      {"// "}
      {stats.map((s, i) => {
        const n = typeof s.value === "number" ? s.value : Number(s.value);
        const lit = Number.isFinite(n) && n !== 0;
        return (
          <span key={s.label}>
            {i > 0 && " · "}
            {`${s.label} `}
            <span
              className={lit ? "font-bold text-[var(--m-accent)]" : "font-bold"}
            >
              {s.value}
            </span>
          </span>
        );
      })}
    </div>
  );
}
