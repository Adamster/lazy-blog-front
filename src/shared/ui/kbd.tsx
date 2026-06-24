interface KbdProps {
  /** The key label (e.g. "ESC", "⌘ K"). */
  children: string;
  className?: string;
}

/**
 * Keycap — renders a key/shortcut as a hard-edged cap. Label scale: JetBrains
 * Mono 11px/0.12em/`leading-none`, square 2px `--m-line` border on `--m-panel`.
 * Static, server-safe; used by the `:kbd[…]` post directive and the LAB.
 */
export function Kbd({ children, className = "" }: KbdProps) {
  return <kbd className={`mono-kbd ${className}`}>{children}</kbd>;
}
