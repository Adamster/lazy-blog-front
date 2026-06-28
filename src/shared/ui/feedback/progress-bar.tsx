"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  label?: string;
  cells?: number;
  className?: string;
}

const RUN = 4;

// Indeterminate `░░██░░` sweep. Saved for future long-task UIs — not yet wired.
export function ProgressBar({
  label,
  cells = 20,
  className = "",
}: ProgressBarProps) {
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPos((p) => (p + 1) % (cells + RUN)), 90);
    return () => clearInterval(id);
  }, [cells]);

  const before = Math.max(0, pos - RUN);
  const filled = Math.min(cells, pos) - before;
  const after = cells - before - filled;

  return (
    <div className={className} style={{ fontFamily: "var(--font-mono)" }}>
      {label ? (
        <div className="mb-2 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase">
          {`// ${label}`}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-label={label ?? "Working"}
        className="flex h-3 items-center overflow-hidden text-[12px] leading-none whitespace-nowrap text-[var(--m-dim)]"
      >
        {"░".repeat(before)}
        <span className="text-[var(--m-accent)]">{"█".repeat(filled)}</span>
        {"░".repeat(after)}
      </div>
    </div>
  );
}
