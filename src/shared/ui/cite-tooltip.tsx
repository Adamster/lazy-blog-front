"use client";

import { useId, useState } from "react";
import { MatrixText } from "./matrix-text";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface CiteTooltipProps {
  /** The inline term carrying the dotted underline. */
  children: string;
  /** The note text the popover decodes once on open. */
  note: string;
  /** Optional eyebrow (11px/0.12em); defaults to `// NOTE`. */
  label?: string;
  className?: string;
}

/**
 * Footnote decode tooltip — an inline term with a dotted `--m-dim` underline;
 * hover/focus pops a bounded popover whose body Matrix-decodes ONCE, then rests.
 * Powers the `:cite[…]{note}` post directive. Popover chrome: 2px `--m-dim`
 * border, `--m-card` bg, body 14px/1.6, `// NOTE` eyebrow 11px/0.12em, sits just
 * under `--m-z-modal`. Reduced motion: the popover shows final text instantly
 * (no scramble) — `MatrixText trigger="hover"` already honours the guard.
 */
export function CiteTooltip({
  children,
  note,
  label = "// NOTE",
  className = "",
}: CiteTooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  // Key the popover content so MatrixText re-mounts (and re-decodes) on each
  // open; under reduced motion it simply renders the final text.
  const reduced = prefersReducedMotion();

  return (
    <span
      className={`mono-cite ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      role="button"
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open ? (
        <span id={id} role="tooltip" className="mono-cite-pop">
          <span className="mono-cite-eyebrow">{label}</span>
          <span className="mono-cite-body">
            {reduced ? (
              note
            ) : (
              // The popover only mounts when open, so a "scroll" trigger fires
              // its single decode pass the instant it appears (already in view).
              <MatrixText
                key={`${id}-open`}
                text={note}
                trigger="scroll"
                className="text-[14px] leading-[1.6]"
              />
            )}
          </span>
        </span>
      ) : null}
    </span>
  );
}
