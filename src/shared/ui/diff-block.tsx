interface DiffBlockProps {
  /**
   * Raw diff text — one change per line. A leading `+ ` marks an added line
   * (accent-tinted), `- ` a removed line (`--m-error`, struck), anything else a
   * context line (`--m-muted`).
   */
  body: string;
  className?: string;
}

type Kind = "add" | "del" | "ctx";

const KIND: Record<Kind, { sign: string; cls: string }> = {
  add: { sign: "+", cls: "mono-diff-add" },
  del: { sign: "-", cls: "mono-diff-del" },
  ctx: { sign: " ", cls: "mono-diff-ctx" },
};

/**
 * Redline / patch block — a static diff readout: added lines accent-tinted with a
 * `+ ` gutter, removed lines `--m-error` struck with `- `, context lines muted,
 * each with a `12px/--m-muted2` tabular line-number gutter. `border-l-2
 * border-[var(--m-accent)]`, 14px/1.6 mono. Powers the `:::diff` post block.
 * Fully static + server-safe (no animation), so reduced motion is a no-op.
 */
export function DiffBlock({ body, className = "" }: DiffBlockProps) {
  const lines = body.split("\n").filter((l) => l.length > 0);
  return (
    <div className={`mono-diff ${className}`}>
      {lines.map((raw, i) => {
        const kind: Kind = raw.startsWith("+ ")
          ? "add"
          : raw.startsWith("- ")
            ? "del"
            : "ctx";
        const text = /^[+-] /.test(raw) ? raw.slice(2) : raw;
        return (
          <div key={i} className={`mono-diff-line ${KIND[kind].cls}`}>
            <span className="mono-diff-num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mono-diff-sign" aria-hidden="true">
              {KIND[kind].sign}
            </span>
            <span className="mono-diff-text">{text}</span>
          </div>
        );
      })}
    </div>
  );
}
