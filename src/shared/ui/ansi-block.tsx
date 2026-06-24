interface AnsiBlockProps {
  /**
   * Space/comma-separated whitelisted token names. Only `accent | error | muted
   * | fg` resolve to a swatch — any other name is ignored (mirrors the colour-
   * directive security stance: the colour is NEVER user-supplied, only a fixed
   * token selected by a closed-whitelist name).
   */
  tokens?: string;
  className?: string;
}

/** Closed whitelist — name → CSS var + label. NOT user-controllable colours. */
const SWATCH: Record<string, { var: string; label: string }> = {
  accent: { var: "var(--m-accent)", label: "ACCENT" },
  error: { var: "var(--m-error)", label: "ERROR" },
  muted: { var: "var(--m-muted)", label: "MUTED" },
  fg: { var: "var(--m-fg)", label: "FG" },
};

const DEFAULT_TOKENS = ["accent", "error", "muted", "fg"];

/**
 * ANSI colour block — a row of `size-4` square chips for the whitelisted `--m-*`
 * tokens (accent/error/muted/fg only), each 2px-bordered with an 11px/0.12em
 * label. Powers the `:::ansi` post block. Fully static; the swatch colour is a
 * fixed token chosen by a closed whitelist name (never a directive-supplied
 * value), so it's safe in UGC prose.
 */
export function AnsiBlock({ tokens, className = "" }: AnsiBlockProps) {
  const names = (tokens ?? "").split(/[\s,]+/).filter((t) => t in SWATCH);
  const list = names.length ? names : DEFAULT_TOKENS;

  return (
    <div className={`mono-ansi ${className}`}>
      {list.map((name, i) => {
        const s = SWATCH[name];
        return (
          <div key={i} className="mono-ansi-chip-row">
            <span
              className="mono-ansi-chip"
              style={{ background: s.var }}
              aria-hidden="true"
            />
            <span className="mono-ansi-label">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}
