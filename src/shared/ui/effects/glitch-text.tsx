interface GlitchTextProps {
  /** The text to glitch (also used for the two ghost layers). */
  children: string;
  /** Extra classes for the wrapper (sizing / font / colour of the main text). */
  className?: string;
  /** Append a blinking block caret after the text. */
  caret?: boolean;
}

/**
 * Brutalist-Mono glitch headline. The main text jitters on the glitch beat while
 * two clipped ghost copies (accent top, error bottom) flash — used by the error
 * (500) / 404 pages. CSS-only (`.mono-glitch*` in tailwind.css), so it works in
 * Server Components, and it degrades under `prefers-reduced-motion` (the
 * ghosts/jitter drop to a legible static frame).
 */
export function GlitchText({
  children,
  className = "",
  caret = false,
}: GlitchTextProps) {
  return (
    <span className={`mono-glitch ${className}`}>
      <span className="mono-glitch-main">
        {children}
        {caret ? <span className="mono-caret" aria-hidden="true" /> : null}
      </span>
      <span className="mono-glitch-ghost mono-glitch-g1" aria-hidden="true">
        {children}
      </span>
      <span className="mono-glitch-ghost mono-glitch-g2" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
