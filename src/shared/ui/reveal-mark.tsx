interface RevealMarkProps {
  /** The text the mark renders (revealed on interaction for `blur`). */
  children: string;
  /**
   * `"blur"` — a `blur(5px)` span in a 2px box that sharpens to focus on click
   * and stays revealed. `"strike"` — a static `line-through` (a struck-out edit),
   * always shown.
   */
  variant: "blur" | "strike";
  className?: string;
}

const BASE: Record<RevealMarkProps["variant"], string> = {
  blur: "mono-spoiler",
  strike: "mono-strike",
};

/**
 * Brutalist-Mono reveal mark — ONE primitive for the `:spoiler[…]` signal blur
 * and the `:strike[…]` struck-out edit (they only differ by `variant`). Both are
 * pure CSS/`--m-*` tokens and server-safe: `blur` rests blurred and sharpens on
 * hover/focus; `strike` is a permanent static `line-through`. Styling lives in
 * `.mono-spoiler` / `.mono-strike` (tailwind.css).
 */
export function RevealMark({
  children,
  variant,
  className = "",
}: RevealMarkProps) {
  const interactive = variant === "blur";

  return (
    <span
      className={`${BASE[variant]} ${className}`}
      {...(interactive ? { tabIndex: 0, role: "button" } : {})}
      aria-label={variant === "blur" ? `Spoiler: ${children}` : undefined}
    >
      {children}
    </span>
  );
}
