import type { ReactNode } from "react";

interface LabelProps {
  // Text WITHOUT the `// ` prefix — the prefix is rendered for you.
  children: ReactNode;
  caret?: boolean;
  uppercase?: boolean;
  /** accent = section eyebrow (heads a section/page/modal);
   *  muted = data label (names the value below it — field & stat labels). */
  tone?: "accent" | "muted";
  className?: string;
}

export function Label({
  children,
  caret = false,
  uppercase = false,
  tone = "accent",
  className = "mono-label",
}: LabelProps) {
  return (
    <div
      className={[
        className,
        tone === "muted" && "text-[var(--m-muted2)]",
        uppercase && "uppercase",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* nbsp: a plain trailing space collapses when a caller makes the Label a
          flex container (empty-state `flex h-8 items-center`), gluing `//` to
          the text. Same advance width as a space in the mono font. */}
      {"//\u00A0"}
      {children}
      {caret && (
        <span style={{ animation: "lzblink 1.1s steps(1) infinite" }}>_</span>
      )}
    </div>
  );
}
