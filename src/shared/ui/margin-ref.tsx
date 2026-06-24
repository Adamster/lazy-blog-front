interface MarginRefProps {
  /** The footnote ordinal (rendered as `[n]`). */
  n: string;
}

/**
 * Margin ledger reference — a superscript `[n]` accent tag that jump-links to its
 * note (`#note-n`) and, on hover/focus, draws a 2px `--m-accent` rule sweeping
 * toward the note (pure CSS, `.mono-ref`). JetBrains Mono 11px/0.12em `--m-accent`
 * on the closed scale. Powers the `:ref[n]` post directive. Static + server-safe;
 * reduced motion drops the sweep (the tag + jump still work).
 */
export function MarginRef({ n }: MarginRefProps) {
  const id = n.replace(/[^a-z0-9]/gi, "");
  return (
    <a href={`#note-${id}`} className="mono-ref" aria-label={`Footnote ${n}`}>
      [{n}]
    </a>
  );
}
