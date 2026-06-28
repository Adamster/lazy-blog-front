import type { ReactNode } from "react";

interface LabelProps {
  // Text WITHOUT the `// ` prefix — the prefix is rendered for you.
  children: ReactNode;
  caret?: boolean;
  uppercase?: boolean;
  className?: string;
}

export function Label({
  children,
  caret = false,
  uppercase = false,
  className = "mono-label",
}: LabelProps) {
  return (
    <div
      className={[className, uppercase && "uppercase"]
        .filter(Boolean)
        .join(" ")}
    >
      {"// "}
      {children}
      {caret && (
        <span style={{ animation: "lzblink 1.1s steps(1) infinite" }}>_</span>
      )}
    </div>
  );
}
