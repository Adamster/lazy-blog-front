"use client";

import { useState, type ReactNode } from "react";
import { MatrixText } from "@/shared/ui/effects";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface FoldBlockProps {
  /** Summary label (rests after the `[ + ]` / `[ – ]` marker). */
  summary?: string;
  /** Body — decodes once on first open when given as plain text via `decode`. */
  children?: ReactNode;
  /** Plain-text body that Matrix-decodes once on first open (post directive). */
  decode?: string;
  className?: string;
}

/**
 * Terminal spoiler / details — an accessible native `<details>`/`<summary>` whose
 * summary reads `[ + ] SHOW` / `[ – ] HIDE` (11px/0.12em accent) and whose body
 * sits on a `border-l-2 border-[var(--m-dim)]` rail (14px/1.6). When a `decode`
 * string is supplied it Matrix-decodes ONCE on the first open. Powers the
 * `:::fold` post block. Reduced motion: opens instantly, body shown as static
 * text (the MatrixText guard handles the no-decode path).
 */
export function FoldBlock({
  summary = "SHOW",
  children,
  decode,
  className = "",
}: FoldBlockProps) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);

  return (
    <details
      className={`mono-fold ${className}`}
      open={open}
      onToggle={(e) => {
        const next = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(next);
        if (next) setOpened(true);
      }}
    >
      <summary className="mono-fold-summary">
        <span className="mono-fold-mark" aria-hidden="true">
          {open ? "[ – ]" : "[ + ]"}
        </span>
        {open ? "HIDE" : summary}
      </summary>
      <div className="mono-fold-body">
        {decode != null ? (
          // Re-mount on first open so the single decode pass runs once; the
          // popover-style "scroll" trigger fires immediately since it's in view.
          opened ? (
            prefersReducedMotion() ? (
              decode
            ) : (
              <MatrixText key="fold-open" text={decode} trigger="scroll" />
            )
          ) : null
        ) : (
          children
        )}
      </div>
    </details>
  );
}
