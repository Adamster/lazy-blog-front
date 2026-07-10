// Full-viewport film-grain overlay — Lazy Cam's atmospheric motif. Pure CSS
// (`.mono-grain` in tailwind.css): animated noise tile, overlay blend,
// reduced-motion freezes it to a static texture. Decorative: aria-hidden.
export function FilmGrain() {
  return <div aria-hidden="true" className="mono-grain" />;
}
