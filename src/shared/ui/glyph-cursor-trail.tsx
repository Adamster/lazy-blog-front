"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { pick } from "@/shared/lib/glyphs";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";

interface TrailGlyph {
  id: number;
  x: number;
  y: number;
  char: string;
}

/** ~200ms before a spawned glyph is reaped — matches the fade animation. */
const LIFE_MS = 220;
/** Throttle spawns so a fast drag doesn't flood the DOM. */
const SPAWN_GAP_MS = 28;

/**
 * Glyph cursor trail — pointer-move over this container spawns fading
 * `--m-accent` matrix glyphs (from the shared {@link pick} alphabet) that drift
 * up and fade in ~200ms. `pointer-events-none` so it never blocks the content
 * underneath; scoped to its own `relative` box (LAB-only). Reduced motion:
 * disabled entirely — no glyphs spawn.
 */
export function GlyphCursorTrail({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [glyphs, setGlyphs] = useState<TrailGlyph[]>([]);
  const idRef = useRef(0);
  const lastSpawn = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
  }, []);

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced.current) return;
    const now = performance.now();
    if (now - lastSpawn.current < SPAWN_GAP_MS) return;
    lastSpawn.current = now;

    const rect = e.currentTarget.getBoundingClientRect();
    const id = idRef.current++;
    const g: TrailGlyph = {
      id,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      char: pick(),
    };
    setGlyphs((prev) => [...prev, g]);
    setTimeout(() => {
      setGlyphs((prev) => prev.filter((p) => p.id !== id));
    }, LIFE_MS);
  }, []);

  return (
    <div
      onPointerMove={onMove}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {glyphs.map((g) => (
          <span
            key={g.id}
            className="mono-trail-glyph absolute text-[12px] text-[var(--m-accent)]"
            style={{ left: g.x, top: g.y }}
          >
            {g.char}
          </span>
        ))}
      </div>
    </div>
  );
}
