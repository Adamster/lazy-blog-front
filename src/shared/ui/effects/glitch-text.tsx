interface GlitchTextProps {
  /** The text to glitch (also used for the two ghost layers). */
  children: string;
  /** Extra classes for the wrapper (sizing / font / colour of the main text). */
  className?: string;
  /** Append a blinking block caret after the text. */
  caret?: boolean;
  /**
   * Opt into the RGB-split-on-hover variant (`.mono-glitch--hover`): the text
   * rests plain and tears into accent/error ghosts only while hovered/focused.
   * Default = the existing always-on glitch beat (error / 404 pages).
   */
  hover?: boolean;
}

/**
 * Brutalist-Mono glitch headline. Default: the main text jitters on the glitch
 * beat while two clipped ghost copies (accent top, error bottom) flash — used by
 * the error (500) / 404 pages. With `hover`, it switches to the pure-CSS
 * chromatic-split-on-hover variant instead. Both are CSS-only (`.mono-glitch*`
 * in tailwind.css), so this works in Server Components, and both degrade under
 * `prefers-reduced-motion` (default drops the ghosts/jitter; hover holds a
 * single static split).
 */
export function GlitchText({
  children,
  className = "",
  caret = false,
  hover = false,
}: GlitchTextProps) {
  if (hover) {
    return (
      <span
        className={`mono-glitch--hover ${className}`}
        data-text={children}
        tabIndex={0}
      >
        {children}
      </span>
    );
  }

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
