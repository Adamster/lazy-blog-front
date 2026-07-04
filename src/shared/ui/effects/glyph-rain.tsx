"use client";

import { useEffect, useRef } from "react";

/**
 * GlyphRainV — the classic Matrix fall (top→bottom) with our binary glyphs:
 * bright head, fading accent trail, per-stream speed jitter. Extracted from the
 * `/brand` GLYPH-RAIN lab (the "12 · V-RAIN (bg)" family) so real surfaces can
 * reuse it (e.g. the arcade signed-out rail). Canvas-drawn on screen-black or
 * the live `--m-bg` (`surface="theme"`); theme-native accent via the live
 * `--m-accent`; degrades to a static scatter under `prefers-reduced-motion`.
 */

const FPS_MS = 1000 / 30;
const REDUCED = "(prefers-reduced-motion: reduce)";
// Canvas can't read `var(--font-mono)`, so name a real monospace family for even spacing.
const MONO = 'ui-monospace, "JetBrains Mono", "Courier New", monospace';
// The Matrix "white head" — a bright pale-lime leading glyph vs the green trail.
const HEAD = "#eaffc0";

/** The house glyph set — binary 0/1. */
export const BIN_GLYPHS = ["0", "1"] as const;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const int = parseInt(n || "0d0d0d", 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export interface GlyphRainVProps {
  glyphs: readonly string[];
  /** Glyph size in px. */
  track?: number;
  /** Extra px between glyph COLUMNS (on top of the monospace advance). */
  colGap?: number;
  /** Extra px between glyph ROWS (line spacing). */
  rowGap?: number;
  /** Fall speed (cols/frame base, with wide per-stream jitter). */
  speed?: number;
  /** TRAIL length — the per-frame fade-to-black alpha. LOWER = longer trail. */
  fade?: number;
  /** Per-frame chance a trail glyph flickers to a new char (brighter blip). */
  mutate?: number;
  /** shadowBlur glow on the head. */
  glow?: number;
  /** Overall opacity of the whole rain (0–1). */
  opacity?: number;
  /** Fraction of columns carrying a stream (0–1; lower = sparser). */
  density?: number;
  /** Head (leading glyph) colour — the bright tip. */
  headHex?: string;
  /** Trail colour override (else the live accent). */
  colorHex?: string;
  /** "dim" swaps the trail to `--m-muted2`. */
  color?: "accent" | "dim";
  /** "black" = screen-black fill (the lab boxes); "theme" = the live `--m-bg`
   *  (rain directly on the page surface — no own panel). On a LIGHT theme bg
   *  the pale head would wash out, so it falls back to the trail colour. */
  surface?: "black" | "theme";
  /** Scatter mode: each run spawns at the top OR a random row and dies out at
   *  a random row (at most the bottom — never past the canvas edge), instead
   *  of the classic full-length top→bottom fall. */
  scatter?: boolean;
  className?: string;
}

export function GlyphRainV({
  glyphs,
  track = 11,
  colGap = 8,
  rowGap = 3,
  speed = 1.15,
  fade = 0.13,
  mutate = 0.45,
  glow = 2,
  opacity = 1,
  density = 1,
  headHex = HEAD,
  colorHex,
  color = "accent",
  surface = "black",
  scatter = false,
  className = "",
}: GlyphRainVProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = Math.round(track * 1.1);
    const font = `${fontSize}px ${MONO}`;
    const rowH = track + rowGap;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let colW = 11;
    let streams: {
      head: number;
      spd: number;
      active: boolean;
      /** First row this run paints (0 unless scatter). */
      start: number;
      /** Last row this run paints — the head vanishes past it and the tail
       *  fades out in place; ≤ rows - 1, so nothing ever crosses the bottom. */
      end: number;
      /** The glyph frozen into each ROW as the head passes (trail chars). */
      chars: string[];
    }[] = [];
    let accent = "#cdff48";
    let dim = "#cdff48";
    let bg: [number, number, number] = [13, 13, 13];
    const pick = () => glyphs[Math.floor(Math.random() * glyphs.length)];
    const trail = () => colorHex || (color === "dim" ? dim : accent);
    // Pale head washes out on a light theme surface → fall back to the trail.
    const head = () =>
      surface === "theme" && bg[0] + bg[1] + bg[2] > 384 ? trail() : headHex;

    const read = () => {
      const cs = getComputedStyle(canvas);
      const a = cs.getPropertyValue("--m-accent").trim();
      if (a) accent = a;
      const m = cs.getPropertyValue("--m-muted2").trim();
      dim = m || accent;
      const b = cs.getPropertyValue("--m-bg").trim();
      bg = surface === "theme" && b ? hexToRgb(b) : [13, 13, 13];
    };

    // "theme" keeps the canvas TRANSPARENT (clearRect) so the page's own CSS
    // bg shows through — painting a parsed copy of `--m-bg` can visibly drift
    // (canvas renders sRGB; CSS colours are display-profile-managed).
    const paintBase = () => {
      if (surface === "theme") {
        ctx.clearRect(0, 0, w, h);
      } else {
        ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
        ctx.fillRect(0, 0, w, h);
      }
    };

    const spawn = () => {
      // Scatter: ~60% of runs begin mid-field, the rest at the top edge; each
      // dies at a random row, capped at the bottom row. Classic: full fall.
      const start =
        scatter && Math.random() < 0.6
          ? Math.floor(Math.random() * rows * 0.75)
          : 0;
      const end = scatter
        ? Math.min(
            rows - 1,
            start + 4 + Math.floor(Math.random() * Math.max(1, rows - start))
          )
        : rows - 1;
      return {
        // Negative offset below `start` = the spawn-delay stagger.
        head: start - Math.random() * rows * 0.8 - 1,
        // Per-stream jitter capped at 1.2× (was 1.8× — the fast tail read frantic).
        spd: speed * (0.3 + Math.random() * 0.9),
        active: Math.random() < density,
        start,
        end,
        chars: [] as string[],
      };
    };

    const resize = () => {
      w = canvas.clientWidth || 800;
      h = canvas.clientHeight || 200;
      canvas.width = w;
      canvas.height = h;
      ctx.font = font;
      colW = Math.max(6, Math.round(ctx.measureText("0").width) + colGap);
      cols = Math.max(1, Math.floor(w / colW));
      // ceil: the last row CLIPS at the bottom edge instead of leaving a bare strip.
      rows = Math.max(1, Math.ceil(h / rowH));
      streams = Array.from({ length: cols }, spawn);
      read();
      paintBase();
    };

    // Trail depth: alpha decays (1 - fade)^k per cell behind the head; stop
    // once it drops under ~0.05, so `fade` keeps its meaning (lower = longer).
    const decay = 1 - fade;
    const trailLen = Math.max(2, Math.ceil(Math.log(0.05) / Math.log(decay)));

    const frame = () => {
      // FULL repaint every pass (no fade-overlay compositing — that technique
      // leaves a permanent grey ghost grid via the 8-bit rounding floor).
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      paintBase();
      ctx.font = font;
      ctx.textBaseline = "top";
      const green = trail();

      for (let c = 0; c < cols; c++) {
        const s = streams[c];
        s.head += s.spd;
        const hr = Math.floor(s.head);
        // Respawn once the tail has fully faded past this run's end row.
        if (hr - trailLen > s.end) {
          Object.assign(s, spawn());
          continue;
        }
        if (!s.active) continue;
        const x = c * colW;
        // Occasional trail flicker (the Matrix mutate blip).
        if (Math.random() < mutate) {
          const r = hr - 2 - Math.floor(Math.random() * (trailLen - 2));
          if (r >= s.start && r <= s.end && r < rows) s.chars[r] = pick();
        }
        for (let k = 0; k < trailLen; k++) {
          const r = hr - k;
          // Past the end row the head is VIRTUAL — only the fading tail stays.
          if (r > s.end || r >= rows) continue;
          if (r < s.start || r < 0) break;
          s.chars[r] ??= pick();
          if (k === 0) {
            ctx.globalAlpha = opacity;
            ctx.fillStyle = head();
            if (glow > 0) {
              ctx.shadowColor = green;
              ctx.shadowBlur = glow;
            }
            ctx.fillText(pick(), x, r * rowH);
            ctx.shadowBlur = 0;
          } else {
            ctx.globalAlpha = opacity * Math.pow(decay, k);
            ctx.fillStyle = green;
            ctx.fillText(s.chars[r], x, r * rowH);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const mq = window.matchMedia(REDUCED);
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FPS_MS) return;
      last = now;
      frame();
    };
    const start = () => {
      if (mq.matches) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        paintBase();
        ctx.font = font;
        ctx.textBaseline = "top";
        ctx.fillStyle = trail();
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            if (Math.random() < 0.12) {
              ctx.globalAlpha = 0.8;
              ctx.fillText(pick(), c * colW, r * rowH);
            }
          }
        }
        ctx.globalAlpha = 1;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    const onMq = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      start();
    };
    mq.addEventListener("change", onMq);
    // Theme flips toggle `.dark` on <html>; a "theme" surface must re-read the
    // live tokens (the per-frame fade overlay then cross-fades the bg swap; the
    // reduced-motion static scatter is repainted outright).
    const themeObserver = new MutationObserver(() => {
      read();
      if (mq.matches) start();
    });
    if (surface === "theme") {
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, [
    glyphs,
    track,
    colGap,
    rowGap,
    speed,
    fade,
    mutate,
    glow,
    opacity,
    density,
    headHex,
    colorHex,
    color,
    surface,
    scatter,
  ]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none block size-full ${className}`}
    />
  );
}
