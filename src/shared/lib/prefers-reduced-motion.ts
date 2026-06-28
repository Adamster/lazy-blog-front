// SSR-safe: `false` on the server (no `window`), re-checked on the client.
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
