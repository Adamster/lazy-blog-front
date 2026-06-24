/**
 * CRT / scanline drape — ALWAYS mounted, visually gated by the `html.crt` class
 * (the `.mono-crt-*` CSS hides itself when the class is absent). Because the
 * toggle is a CSS class — not React state driving the mount — the layout's
 * pre-paint inline script can set `html.crt` from `localStorage('crt')` with NO
 * hydration mismatch. Two fixed `pointer-events-none` layers: the multiply
 * scanlines (+ slow flicker, dropped under `prefers-reduced-motion`) and a soft
 * vignette. Sits at `--m-z-crt` — over page content + header, under modals /
 * toasts. Rendered once near the app `<Toaster/>`.
 */
export function CrtOverlay() {
  return (
    <>
      <div className="mono-crt-scan" aria-hidden="true" />
      <div className="mono-crt-vignette" aria-hidden="true" />
    </>
  );
}
