/**
 * The HATE-IT glyph for the post vote band (`// LOVE IT` / `// HATE IT`), paired
 * with the solid heroicon `HeartIcon` on the LOVE side. It's a hand-drawn stroke
 * SVG (no solid heroicon match) — kept here as a shared primitive so any surface
 * needing it uses the identical glyph instead of forking it.
 */
export const BrokenHeartIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.572a5 5 0 1 1 7.5 6.572" />
    <path d="M12 6l-2 4l3 3l-2 4" />
  </svg>
);
