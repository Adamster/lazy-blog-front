interface StatBarProps {
  label: string;
  value: number;
  /** Below this the fill reads as critical (`--m-error`). */
  lowThreshold?: number;
  cells?: number;
  className?: string;
}

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
