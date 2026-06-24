"use client";

import { useInViewOnce } from "@/shared/lib/use-in-view";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

export interface PollRow {
  /** 11px/0.12em label. */
  label: string;
  /** 0–100 percentage. */
  value: number;
}

interface PollBlockProps {
  rows: PollRow[];
  className?: string;
}

/**
 * ASCII bar readout — labelled poll bars that fill left→right the first time the
 * block scrolls into view: a `--m-dim` track with a `--m-accent` fill, an
 * 11px/0.12em label above and a 12px tabular `%` on the right. Powers the
 * `:::poll` post block. Reduced motion: the bars render pre-filled (no grow).
 */
export function PollBlock({ rows, className = "" }: PollBlockProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const fill = inView || prefersReducedMotion();

  return (
    <div ref={ref} className={`mono-poll ${className}`}>
      {rows.map((row, i) => {
        const pct = Math.min(100, Math.max(0, Math.round(row.value)));
        return (
          <div key={i} className="mono-poll-row">
            <div className="mono-poll-head">
              <span className="mono-poll-label">{row.label}</span>
              <span className="mono-poll-pct">{pct}%</span>
            </div>
            <div
              className="mono-poll-track"
              role="progressbar"
              aria-label={row.label}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="mono-poll-fill"
                style={{ width: fill ? `${pct}%` : "0%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
