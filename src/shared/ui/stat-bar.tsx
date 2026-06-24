interface StatBarProps {
  /** 11px / 0.12em uppercase label (e.g. `CPU`). */
  label: string;
  /** 0–100 fill percentage. */
  value: number;
  /** Below this the fill reads as critical (`--m-error`). Default 10. */
  lowThreshold?: number;
  /** Cells in the track. Default 24. */
  cells?: number;
  className?: string;
}

/**
 * A determinate statistics bar — `LABEL ████░░░░░ 38%`. A block track (filled
 * accent run + dotted `░` remainder) with a leading label and a right-aligned
 * tabular `%`. Values under `lowThreshold` flip the fill to `--m-error`
 * (a critical reading). On the closed scale: 11px / 0.12em label, 2px geometry,
 * tabular-nums percent.
 */
export function StatBar({
  label,
  value,
  lowThreshold = 10,
  cells = 24,
  className = "",
}: StatBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const filled = Math.round((pct / 100) * cells);
  const empty = cells - filled;
  const critical = pct < lowThreshold;
  const fillColor = critical ? "var(--m-error)" : "var(--m-accent)";

  return (
    <div
      className={`grid grid-cols-[7rem_1fr_auto] items-center gap-4 ${className}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase">
        {label}
      </span>
      <span
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="flex h-3 items-center overflow-hidden text-[12px] leading-none whitespace-nowrap text-[var(--m-dim)]"
      >
        <span style={{ color: fillColor }}>{"█".repeat(filled)}</span>
        {"░".repeat(empty)}
      </span>
      <span
        className="text-[12px] leading-none tabular-nums"
        style={{ color: fillColor }}
      >
        {pct}%
      </span>
    </div>
  );
}
