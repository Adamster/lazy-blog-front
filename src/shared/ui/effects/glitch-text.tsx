interface GlitchTextProps {
  children: string;
  className?: string;
  caret?: boolean;
}

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
