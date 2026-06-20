"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  /** 0–100 determinate fill. Omit for an animated indeterminate bar. */
  value?: number;
  /** `// LABEL` eyebrow above the bar. */
  label?: string;
  /** Number of fill cells (each = 100/cells %). Default 20. */
  cells?: number;
  className?: string;
}

const INDETERMINATE_RUN = 4;

/**
 * Terminal block progress bar — `[████░░░░]` (█ filled accent · ░ empty dim).
 * Determinate when `value` is set (shows N%), otherwise an animated
 * indeterminate sweep. Saved for future upload / long-task UIs (e.g. the cover
 * image upload) — not yet wired anywhere.
 */
export function ProgressBar({
  value,
  label,
  cells = 20,
  className = "",
}: ProgressBarProps) {
  const indeterminate = value == null;
  const [pos, setPos] = useState(0);

  useEffect(() => {
    if (!indeterminate) return;
    const id = setInterval(
      () => setPos((p) => (p + 1) % (cells + INDETERMINATE_RUN)),
      90
    );
    return () => clearInterval(id);
  }, [indeterminate, cells]);

  let before: number;
  let filled: number;
  if (indeterminate) {
    const start = Math.max(0, pos - INDETERMINATE_RUN);
    before = start;
    filled = Math.min(cells, pos) - start;
  } else {
    before = 0;
    filled = Math.round((Math.min(100, Math.max(0, value)) / 100) * cells);
  }
  const after = cells - before - filled;

  return (
    <div className={className} style={{ fontFamily: "var(--font-mono)" }}>
      {label ? (
        <div className="mb-2 text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
          {`// ${label}`}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="text-[13px] leading-none tracking-[0.02em] whitespace-nowrap text-[var(--m-dim)]"
      >
        {"["}
        {"░".repeat(before)}
        <span className="text-[var(--m-accent)]">{"█".repeat(filled)}</span>
        {"░".repeat(after)}
        {"]"}
      </div>
      {!indeterminate ? (
        <div className="mt-1 text-[11px] tracking-[0.06em] text-[var(--m-muted2)] tabular-nums">
          {`${Math.round(value)}%`}
        </div>
      ) : null}
    </div>
  );
}
