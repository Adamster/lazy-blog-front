import type { ReactNode } from "react";

interface MonoLabelProps {
  /** Label text WITHOUT the `// ` prefix — the prefix is rendered for you. */
  children: ReactNode;
  /** Add a blinking terminal caret after the text (home "MOST ACTIVE USER"). */
  caret?: boolean;
  /** Uppercase the text (the readers-liked label uses this). */
  uppercase?: boolean;
  /** Override the default accent color class (e.g. muted2 for the vote label). */
  className?: string;
}

/**
 * The accent `// LABEL` eyebrow used across the mono surfaces (home/profile
 * stats, `// PUBLICATIONS`, `// ADD COMMENT`, auth eyebrows, …). Renders the
 * `// ` prefix and an optional blinking caret so callers pass only the text.
 */
export function MonoLabel({
  children,
  caret = false,
  uppercase = false,
  className = "mono-label",
}: MonoLabelProps) {
  return (
    <div className={`${className}${uppercase ? "uppercase" : ""}`}>
      {"// "}
      {children}
      {caret && (
        <span style={{ animation: "lzblink 1.1s steps(1) infinite" }}>_</span>
      )}
    </div>
  );
}
