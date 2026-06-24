"use client";

import { useInViewOnce } from "@/shared/lib/use-in-view";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface RevealMarkProps {
  /** The text hidden behind the mark (and revealed on interaction). */
  children: string;
  /**
   * `"redact"` — a solid `--m-fg` censor block that wipes away L→R to reveal the
   * text on hover/focus/tap. `"blur"` — a `blur(5px)` span in a 2px box that
   * sharpens to focus on click and stays revealed. `"strike"` — a 2px
   * `--m-accent` strike-through that draws L→R the first time it scrolls into
   * view (a self-redacting edit), then rests struck.
   */
  variant: "redact" | "blur" | "strike";
  className?: string;
}

const BASE: Record<RevealMarkProps["variant"], string> = {
  redact: "mono-redact",
  blur: "mono-spoiler",
  strike: "mono-strike",
};

/**
 * Brutalist-Mono reveal mark — ONE primitive for the `:redact[…]` censor bar, the
 * `:spoiler[…]` signal blur and the `:strike[…]` self-redacting edit (they only
 * differ by `variant`). `redact`/`blur` are pure CSS/`--m-*` tokens (Server-safe);
 * `strike` adds a scroll-in trigger so the line draws once on first view. All
 * degrade under `prefers-reduced-motion` (the redact/blur snap to their revealed
 * end-state; the strike shows struck immediately, no draw). Styling lives in
 * `.mono-redact` / `.mono-spoiler` / `.mono-strike` (tailwind.css).
 */
export function RevealMark({
  children,
  variant,
  className = "",
}: RevealMarkProps) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>();
  // Only the strike variant animates on scroll-in; redact/blur are interaction-
  // driven and need no ref/observer, but sharing one hook keeps the markup flat.
  const draw = variant === "strike" && inView && !prefersReducedMotion();

  const interactive = variant === "redact" || variant === "blur";

  return (
    <span
      ref={ref}
      className={`${BASE[variant]} ${draw ? "mono-strike--draw" : ""} ${className}`}
      {...(interactive ? { tabIndex: 0, role: "button" } : {})}
      aria-label={
        variant === "redact"
          ? `Redacted: ${children}`
          : variant === "blur"
            ? `Spoiler: ${children}`
            : undefined
      }
    >
      {children}
    </span>
  );
}
