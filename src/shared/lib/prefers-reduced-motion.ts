/**
 * `true` when the user has asked the OS to minimise motion. Single source for
 * the reduced-motion guard every animated primitive shares (MatrixText, the LAB
 * toys, scroll-triggered marks) — so "skip the animation, show the static
 * end-state" is decided in exactly one place (no drift between effects).
 *
 * SSR-safe: returns `false` on the server (no `window`), so the first paint is
 * the animated-capable markup; the guard re-checks on the client.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
