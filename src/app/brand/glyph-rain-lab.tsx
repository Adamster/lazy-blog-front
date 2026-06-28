"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Section, Panel } from "./_helpers";

/* ------------------------------------------------------------------ *
 * Experimental glyph-fade — LAB / preview ONLY. Horizontal LANES: each
 * row is a filled very-dark-grey track (height = `track`) separated by a
 * black `gap`. Inside each lane a line of bits blinks (fade in → hold →
 * fade at random cells, lane kept ~half-lit), bit-flipping + a faint glow.
 * Monospace digits sized to fill the lane, evenly spaced. Horizontal (vs
 * The Matrix's vertical columns). Not the effect's final home.
 * ------------------------------------------------------------------ */

type Surface = "black" | "theme";
type ColorMode = "accent" | "dim";

const FADE_FPS_MS = 1000 / 30;
const REDUCED = "(prefers-reduced-motion: reduce)";
/** Canvas can't read `var(--font-mono)`; use a real monospace family so the
 *  size + advance are honoured (equal-width = even spacing). */
const MONO = 'ui-monospace, "JetBrains Mono", "Courier New", monospace';

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

interface GlyphFadeProps {
  glyphs: readonly string[];
  /** Lane height in px — the filled grey track; the glyph is sized to fill it. */
  track?: number;
  /** Black gap between lanes in px. */
  gap?: number;
  /** Lane grey alpha (a very light tint over black). */
  trackAlpha?: number;
  /** Fraction of each LANE lit at once (cap; ~0.5 = half). */
  fillRatio?: number;
  /** Alpha change per frame — bigger = faster, snappier ramp. */
  fadeSpeed?: number;
  /** Frames a glyph holds at full before it starts fading out. */
  hold?: number;
  /** Per-frame chance a HELD glyph swaps to another (bit-flip flicker). */
  flip?: number;
  /** Canvas shadowBlur on the glyph (a faint glow). */
  glow?: number;
  /** Override the glyph colour (e.g. Nixie orange). Falls back to the accent. */
  colorHex?: string;
  /** "black" = screen-black; "theme" = the live --m-bg. */
  surface?: Surface;
  color?: ColorMode;
  className?: string;
}

type Cell = { a: number; v: number; g: string; life: number };

function GlyphFade({
  glyphs,
  track = 16,
  gap = 6,
  trackAlpha = 0.05,
  fillRatio = 0.5,
  fadeSpeed = 0.12,
  hold = 7,
  flip = 0.14,
  glow = 2,
  colorHex,
  surface = "black",
  color = "accent",
  className = "",
}: GlyphFadeProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pitch = track + gap;
    // Glyph sized to fill the lane; centred.
    const fontSize = Math.round(track * 1.1);
    const font = `${fontSize}px ${MONO}`;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let colW = 11;
    let cells: Cell[] = [];
    let accent = "#cdff48";
    let dim = "#cdff48";
    let bg: [number, number, number] = [13, 13, 13];
    let laneLayer: HTMLCanvasElement | null = null;
    const at = (r: number, c: number) => cells[r * cols + c];
    const pick = () => glyphs[Math.floor(Math.random() * glyphs.length)];
    const baseColor = () => colorHex || (color === "dim" ? dim : accent);

    const read = () => {
      const cs = getComputedStyle(canvas);
      const a = cs.getPropertyValue("--m-accent").trim();
      if (a) accent = a;
      const m = cs.getPropertyValue("--m-muted2").trim();
      dim = m || accent;
      const b = cs.getPropertyValue("--m-bg").trim();
      bg = surface === "theme" && b ? hexToRgb(b) : [13, 13, 13];
    };

    const buildLanes = () => {
      if (trackAlpha <= 0) {
        laneLayer = null;
        return;
      }
      const oc = document.createElement("canvas");
      oc.width = w;
      oc.height = h;
      const o = oc.getContext("2d");
      if (!o) {
        laneLayer = null;
        return;
      }
      o.fillStyle = `rgba(255,255,255,${trackAlpha})`;
      for (let r = 0; r < rows; r++) {
        o.fillRect(0, r * pitch, w, track);
      }
      laneLayer = oc;
    };

    const resize = () => {
      w = canvas.clientWidth || 800;
      h = canvas.clientHeight || 200;
      canvas.width = w;
      canvas.height = h;
      // Even spacing: column pitch = the monospace advance (+1px breathing).
      ctx.font = font;
      colW = Math.max(6, Math.round(ctx.measureText("0").width) + 1);
      cols = Math.max(1, Math.floor(w / colW));
      rows = Math.max(1, Math.floor(h / pitch));
      cells = Array.from({ length: cols * rows }, () => ({
        a: 0,
        v: 0,
        g: " ",
        life: 0,
      }));
      read();
      buildLanes();
    };

    const frame = () => {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      ctx.fillRect(0, 0, w, h);
      if (laneLayer) ctx.drawImage(laneLayer, 0, 0);
      ctx.font = font;
      ctx.textBaseline = "middle";
      const colHex = baseColor();
      const target = Math.max(1, Math.floor(cols * fillRatio));

      for (let r = 0; r < rows; r++) {
        let lit = 0;
        const yMid = r * pitch + track / 2;
        for (let c = 0; c < cols; c++) {
          const cell = at(r, c);
          if (cell.v > 0) {
            cell.a += cell.v;
            if (cell.a >= 0.9) {
              cell.a = 0.9;
              cell.v = 0;
              cell.life = hold;
            }
          } else if (cell.v < 0) {
            cell.a += cell.v;
            if (cell.a <= 0) {
              cell.a = 0;
              cell.v = 0;
              cell.g = " ";
            }
          } else if (cell.life > 0) {
            if (flip && Math.random() < flip) cell.g = pick();
            cell.life--;
            if (cell.life <= 0) cell.v = -fadeSpeed;
          }
          if (cell.a > 0.02) {
            lit++;
            ctx.globalAlpha = cell.a;
            ctx.fillStyle = colHex;
            if (glow > 0) {
              ctx.shadowColor = colHex;
              ctx.shadowBlur = glow;
            }
            ctx.fillText(cell.g, c * colW, yMid);
            ctx.shadowBlur = 0;
          }
        }
        ctx.globalAlpha = 1;
        if (lit < target && Math.random() < 0.5) {
          for (let tries = 0; tries < 4; tries++) {
            const c = Math.floor(Math.random() * cols);
            const cell = at(r, c);
            if (cell.a <= 0.02 && cell.v === 0 && cell.life <= 0) {
              cell.g = pick();
              cell.v = fadeSpeed;
              break;
            }
          }
        }
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const mq = window.matchMedia(REDUCED);
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FADE_FPS_MS) return;
      last = now;
      frame();
    };
    const start = () => {
      if (mq.matches) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
        ctx.fillRect(0, 0, w, h);
        if (laneLayer) ctx.drawImage(laneLayer, 0, 0);
        ctx.font = font;
        ctx.textBaseline = "middle";
        ctx.fillStyle = baseColor();
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (Math.random() < fillRatio) {
              ctx.globalAlpha = 0.9;
              ctx.fillText(pick(), c * colW, r * pitch + track / 2);
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
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, [
    glyphs,
    track,
    gap,
    trackAlpha,
    fillRatio,
    fadeSpeed,
    hold,
    flip,
    glow,
    colorHex,
    surface,
    color,
  ]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none block size-full ${className}`}
    />
  );
}

/* ---- Variant 2: HORIZONTAL RAIN ---------------------------------- *
 * The Matrix rain turned 90°: in each grey lane a stream of glyphs flows
 * LEFT→RIGHT, a bright head with a fading trail behind it.
 * ------------------------------------------------------------------ */

interface RainHProps {
  glyphs: readonly string[];
  /** Row pitch (line height) in px. */
  track?: number;
  gap?: number;
  /** Extra px between glyphs horizontally (on top of the monospace advance). */
  colGap?: number;
  /** Head advance in columns per frame (with per-lane jitter). */
  speed?: number;
  /** Trail-fade overlay alpha per frame — lower = longer trails. */
  fade?: number;
  /** Per-frame chance a trail glyph flickers to a new char (Matrix mutate). */
  mutate?: number;
  glow?: number;
  /** Randomise each lane's flow direction (some →, some ←). */
  bidir?: boolean;
  colorHex?: string;
  color?: ColorMode;
  className?: string;
}

/** Bright pale-lime leading head (vs the green trail) — the Matrix "white head". */
const HEAD = "#eaffc0";

function GlyphRainH({
  glyphs,
  track = 12,
  gap = 7,
  colGap = 1,
  speed = 0.5,
  fade = 0.13,
  mutate = 0.35,
  glow = 3,
  bidir = false,
  colorHex,
  color = "accent",
  className = "",
}: RainHProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pitch = track + gap;
    const fontSize = Math.round(track * 1.1);
    const font = `${fontSize}px ${MONO}`;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let colW = 11;
    // head = current head column (float); seen = last column already painted
    // green; dir = +1 (flows right) or -1 (flows left).
    let lanes: { head: number; spd: number; seen: number; dir: number }[] = [];
    let accent = "#cdff48";
    let dim = "#cdff48";
    const pick = () => glyphs[Math.floor(Math.random() * glyphs.length)];
    const trail = () => colorHex || (color === "dim" ? dim : accent);

    const read = () => {
      const cs = getComputedStyle(canvas);
      const a = cs.getPropertyValue("--m-accent").trim();
      if (a) accent = a;
      const m = cs.getPropertyValue("--m-muted2").trim();
      dim = m || accent;
    };

    const spawn = () => {
      const dir = bidir && Math.random() < 0.5 ? -1 : 1;
      const head =
        dir === 1
          ? -Math.random() * cols * 0.8 - 1
          : cols + Math.random() * cols * 0.8 + 1;
      return {
        head,
        // Wide per-lane speed spread — some lanes crawl, some race.
        spd: speed * (0.3 + Math.random() * 1.5),
        seen: dir === 1 ? Math.floor(head) - 1 : Math.ceil(head) + 1,
        dir,
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
      rows = Math.max(1, Math.floor(h / pitch));
      lanes = Array.from({ length: rows }, spawn);
      read();
      ctx.fillStyle = "rgb(13,13,13)";
      ctx.fillRect(0, 0, w, h);
    };

    const frame = () => {
      // Trail fade — the Matrix technique: dim the whole frame toward black so
      // older glyphs decay; we only paint the head + newly-passed cells.
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(13,13,13,${fade})`;
      ctx.fillRect(0, 0, w, h);
      ctx.font = font;
      ctx.textBaseline = "middle";
      const green = trail();

      for (let r = 0; r < rows; r++) {
        const lane = lanes[r];
        const yMid = r * pitch + track / 2;
        lane.head += lane.spd * lane.dir;
        const hc = Math.floor(lane.head);
        // Paint the columns the head just passed in green (the trail behind it).
        if (lane.dir === 1) {
          while (lane.seen < hc - 1) {
            lane.seen++;
            if (lane.seen >= 0 && lane.seen < cols) {
              ctx.globalAlpha = 1;
              ctx.fillStyle = green;
              ctx.fillText(pick(), lane.seen * colW, yMid);
            }
          }
        } else {
          while (lane.seen > hc + 1) {
            lane.seen--;
            if (lane.seen >= 0 && lane.seen < cols) {
              ctx.globalAlpha = 1;
              ctx.fillStyle = green;
              ctx.fillText(pick(), lane.seen * colW, yMid);
            }
          }
        }
        // The bright head, redrawn each frame so it stays lit + glows.
        if (hc >= 0 && hc < cols) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = HEAD;
          if (glow > 0) {
            ctx.shadowColor = green;
            ctx.shadowBlur = glow;
          }
          ctx.fillText(pick(), hc * colW, yMid);
          ctx.shadowBlur = 0;
        }
        // Flicker a random trail glyph (behind the head) back to life.
        if (Math.random() < mutate) {
          const c = hc - lane.dir * (2 + Math.floor(Math.random() * 12));
          if (c >= 0 && c < cols) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = green;
            ctx.fillText(pick(), c * colW, yMid);
          }
        }
        if (
          (lane.dir === 1 && hc - 1 > cols + 14) ||
          (lane.dir === -1 && hc + 1 < -14)
        ) {
          Object.assign(lane, spawn());
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
      if (now - last < FADE_FPS_MS) return;
      last = now;
      frame();
    };
    const start = () => {
      if (mq.matches) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgb(13,13,13)";
        ctx.fillRect(0, 0, w, h);
        ctx.font = font;
        ctx.textBaseline = "middle";
        ctx.fillStyle = trail();
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (Math.random() < 0.12) {
              ctx.globalAlpha = 0.8;
              ctx.fillText(pick(), c * colW, r * pitch + track / 2);
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
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, [
    glyphs,
    track,
    gap,
    colGap,
    speed,
    fade,
    mutate,
    glow,
    bidir,
    colorHex,
    color,
  ]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none block size-full ${className}`}
    />
  );
}

/* ---- Variant 3: VERTICAL RAIN ------------------------------------ *
 * The same trick but falling TOP→BOTTOM — i.e. the classic Matrix rain,
 * with our 0/1 glyphs. Here to gauge how close it reads to the film.
 * ------------------------------------------------------------------ */

interface RainVProps {
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
  color?: ColorMode;
  className?: string;
}

function GlyphRainV({
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
  className = "",
}: RainVProps) {
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
      seen: number;
      active: boolean;
    }[] = [];
    let accent = "#cdff48";
    let dim = "#cdff48";
    const pick = () => glyphs[Math.floor(Math.random() * glyphs.length)];
    const trail = () => colorHex || (color === "dim" ? dim : accent);

    const read = () => {
      const cs = getComputedStyle(canvas);
      const a = cs.getPropertyValue("--m-accent").trim();
      if (a) accent = a;
      const m = cs.getPropertyValue("--m-muted2").trim();
      dim = m || accent;
    };

    const spawn = () => {
      const head = -Math.random() * rows * 0.8 - 1;
      return {
        head,
        spd: speed * (0.3 + Math.random() * 1.5),
        seen: Math.floor(head) - 1,
        active: Math.random() < density,
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
      rows = Math.max(1, Math.floor(h / rowH));
      streams = Array.from({ length: cols }, spawn);
      read();
      ctx.fillStyle = "rgb(13,13,13)";
      ctx.fillRect(0, 0, w, h);
    };

    const frame = () => {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(13,13,13,${fade})`;
      ctx.fillRect(0, 0, w, h);
      ctx.font = font;
      ctx.textBaseline = "top";
      const green = trail();

      for (let c = 0; c < cols; c++) {
        const s = streams[c];
        s.head += s.spd;
        const hr = Math.floor(s.head);
        if (hr - 1 > rows + 14) {
          Object.assign(s, spawn());
          continue;
        }
        if (!s.active) continue;
        const x = c * colW;
        while (s.seen < hr - 1) {
          s.seen++;
          if (s.seen >= 0 && s.seen < rows) {
            ctx.globalAlpha = opacity;
            ctx.fillStyle = green;
            ctx.fillText(pick(), x, s.seen * rowH);
          }
        }
        if (hr >= 0 && hr < rows) {
          ctx.globalAlpha = opacity;
          ctx.fillStyle = headHex;
          if (glow > 0) {
            ctx.shadowColor = green;
            ctx.shadowBlur = glow;
          }
          ctx.fillText(pick(), x, hr * rowH);
          ctx.shadowBlur = 0;
        }
        if (Math.random() < mutate) {
          const r = hr - 2 - Math.floor(Math.random() * 12);
          if (r >= 0 && r < rows) {
            ctx.globalAlpha = 0.85 * opacity;
            ctx.fillStyle = green;
            ctx.fillText(pick(), x, r * rowH);
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
      if (now - last < FADE_FPS_MS) return;
      last = now;
      frame();
    };
    const start = () => {
      if (mq.matches) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgb(13,13,13)";
        ctx.fillRect(0, 0, w, h);
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
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
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
  ]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none block size-full ${className}`}
    />
  );
}

const BIN = ["0", "1"] as const;
const DIGITS = "0123456789".split("");
/** Classic Nixie neon-orange. */
const NIXIE = "#ff7e29";

type Variant = {
  key: string;
  note: string;
  props: Omit<GlyphFadeProps, "className">;
};

const VARIANTS: Variant[] = [
  {
    key: "1 · NIXIE GREEN (bg)",
    note: "The live neo-bg — small digits, big black gaps between lanes, only ~12% of each lane lit at once, soft glow, green accent. (On the page it's also at low opacity so it never fights the foreground.)",
    props: {
      glyphs: DIGITS,
      track: 10,
      gap: 12,
      trackAlpha: 0.05,
      fillRatio: 0.12,
      glow: 4,
      fadeSpeed: 0.07,
      hold: 30,
      flip: 0.04,
    },
  },
  {
    key: "2 · SPARSER",
    note: "Even fewer active digits at once (~6% of each lane).",
    props: {
      glyphs: DIGITS,
      track: 10,
      gap: 12,
      trackAlpha: 0.05,
      fillRatio: 0.06,
      glow: 4,
      fadeSpeed: 0.07,
      hold: 30,
      flip: 0.04,
    },
  },
  {
    key: "3 · BIGGER GAP",
    note: "16px black gap between the lanes.",
    props: {
      glyphs: DIGITS,
      track: 10,
      gap: 16,
      trackAlpha: 0.05,
      fillRatio: 0.22,
      glow: 4,
      fadeSpeed: 0.07,
      hold: 30,
      flip: 0.04,
    },
  },
  {
    key: "4 · DARKER LANES",
    note: "Lane grey even closer to black.",
    props: {
      glyphs: DIGITS,
      track: 10,
      gap: 12,
      trackAlpha: 0.03,
      fillRatio: 0.22,
      glow: 4,
      fadeSpeed: 0.07,
      hold: 30,
      flip: 0.04,
    },
  },
  {
    key: "5 · BINARY",
    note: "Same look, only 0/1 instead of 0–9.",
    props: {
      glyphs: BIN,
      track: 10,
      gap: 12,
      trackAlpha: 0.05,
      fillRatio: 0.22,
      glow: 4,
      fadeSpeed: 0.07,
      hold: 30,
      flip: 0.04,
    },
  },
  {
    key: "6 · NIXIE ORANGE",
    note: "The warm orange take, for reference (the bg keeps the green).",
    props: {
      glyphs: DIGITS,
      colorHex: NIXIE,
      track: 10,
      gap: 12,
      trackAlpha: 0.05,
      fillRatio: 0.22,
      glow: 5,
      fadeSpeed: 0.07,
      hold: 30,
      flip: 0.04,
    },
  },
];

type HRainVariant = {
  key: string;
  note: string;
  props: Omit<RainHProps, "className">;
};

const HRAIN_VARIANTS: HRainVariant[] = [
  {
    key: "7 · H-RAIN (base)",
    note: "White-head streams flow left→right, green fading trail, glyphs mutating. Speed 0.5, 12px, light glow.",
    props: {
      glyphs: BIN,
      track: 12,
      gap: 7,
      speed: 0.5,
      fade: 0.13,
      glow: 3,
      mutate: 0.35,
    },
  },
  {
    key: "8 · SMALL + FAST",
    note: "Smaller dense bits, faster streams — busier, denser.",
    props: {
      glyphs: BIN,
      track: 9,
      gap: 5,
      speed: 0.75,
      fade: 0.11,
      glow: 2,
      mutate: 0.4,
    },
  },
  {
    key: "9 · LONG TRAILS",
    note: "Lower fade → longer trails, the screen reads fuller.",
    props: {
      glyphs: BIN,
      track: 11,
      gap: 6,
      speed: 0.55,
      fade: 0.07,
      glow: 3,
      mutate: 0.45,
    },
  },
  {
    key: "10 · BIG + SLOW",
    note: "Bigger digits, slower, sparser streams.",
    props: {
      glyphs: BIN,
      track: 16,
      gap: 8,
      speed: 0.35,
      fade: 0.13,
      glow: 3,
      mutate: 0.3,
    },
  },
  {
    key: "11 · RANDOM DIRECTION",
    note: "Like 8 (small + fast) but each lane picks its own way — some flow →, some ← — and re-randomise on respawn.",
    props: {
      glyphs: BIN,
      track: 9,
      gap: 5,
      speed: 0.75,
      fade: 0.11,
      glow: 2,
      mutate: 0.4,
      bidir: true,
    },
  },
];

type VRainVariant = {
  key: string;
  note: string;
  props: Omit<RainVProps, "className">;
};

const VRAIN_VARIANTS: VRainVariant[] = [
  {
    key: "12 · V-RAIN (bg)",
    note: "The live neo-bg preset — 0/1 falling top→bottom, white head, medium trail.",
    props: { glyphs: BIN, speed: 0.95, fade: 0.13 },
  },
  {
    key: "13 · LONG TRAIL",
    note: "Longer trails (fade 0.06).",
    props: { glyphs: BIN, speed: 0.95, fade: 0.06 },
  },
  {
    key: "14 · SHORT TRAIL",
    note: "Short trails (fade 0.24).",
    props: { glyphs: BIN, speed: 0.95, fade: 0.24 },
  },
  {
    key: "15 · SPARSE",
    note: "Only ~50% of columns carry a stream (density 0.5).",
    props: { glyphs: BIN, speed: 0.95, fade: 0.13, density: 0.5 },
  },
  {
    key: "16 · DIM + GREEN HEAD",
    note: "Dimmer overall (opacity 0.6) + a green head instead of white.",
    props: {
      glyphs: BIN,
      speed: 0.95,
      fade: 0.13,
      opacity: 0.6,
      headHex: "#cdff48",
    },
  },
];

/** Full-viewport takeover for a rain effect — Esc / click to exit. */
function FullscreenRain({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Effect fullscreen — press Escape or click to exit"
      onClick={onClose}
      className="mono-portal fixed inset-0 z-[var(--m-z-rain)] cursor-pointer bg-black"
    >
      <div className="absolute inset-0">{children}</div>
      <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.12em] text-[var(--m-accent)] uppercase">
        Click or press esc to exit
      </div>
    </div>,
    document.body
  );
}

export function GlyphRainVariantsSection() {
  const [fs, setFs] = useState<ReactNode>(null);

  const box = (key: string, note: string, effect: ReactNode) => (
    <Panel key={key} caption={`// ${key}`}>
      <div className="relative h-[200px] overflow-hidden border-2 border-[var(--m-dim)] bg-black">
        {effect}
        <button
          type="button"
          onClick={() => setFs(effect)}
          className="mono-focus absolute right-3 bottom-3 inline-flex h-7 items-center justify-center border-2 border-[var(--m-accent)] bg-black/50 px-3 text-[11px] font-semibold tracking-[0.12em] text-[var(--m-accent)] uppercase transition-colors hover:bg-[var(--m-accent)] hover:text-black"
        >
          Fullscreen
        </button>
      </div>
      <p className="mt-4 text-[12px] leading-[1.6] text-[var(--m-muted)]">
        {note}
      </p>
    </Panel>
  );

  return (
    <Section
      index="01"
      title="GLYPH-RAIN — EXPERIMENTS"
      intro="Our own falling-glyph backdrop — binary 0/1 in our colour + mono font, a data shimmer of its own. 1–6 a grey-LANES fade take; 7–11 horizontal streams (white head, fading trail, random speed/direction); 12–16 the same falling top→bottom (vertical), with knobs for trail / density / opacity. Hit Fullscreen on any box to see it on the whole screen (Esc / click to exit)."
    >
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
        {VARIANTS.map((v) => box(v.key, v.note, <GlyphFade {...v.props} />))}
        {HRAIN_VARIANTS.map((v) =>
          box(v.key, v.note, <GlyphRainH {...v.props} />)
        )}
        {VRAIN_VARIANTS.map((v) =>
          box(v.key, v.note, <GlyphRainV {...v.props} />)
        )}
      </div>
      {fs && <FullscreenRain onClose={() => setFs(null)}>{fs}</FullscreenRain>}
    </Section>
  );
}

/** The Glyph Rain tab — masthead + the experiments. */
export function GlyphRainTab() {
  return (
    <>
      <div className="text-[11px] tracking-[0.12em] text-[var(--m-accent)]">
        {"// NOT LAZY — GLYPH RAIN"}
      </div>
      <h1 className="font-display mt-7 text-[40px] leading-none font-bold tracking-[-0.02em]">
        Glyph Rain
      </h1>
      <p className="mt-5 text-[14px] leading-[1.7] text-[var(--m-muted)]">
        Our own falling-glyph backdrop — binary 0/1 in the live accent + the
        mono font, a data shimmer of its own. Several directions below (grey
        lanes, horizontal streams, vertical fall); each can be opened
        Fullscreen. Theme follows the header toggle; everything degrades under
        reduced-motion.
      </p>

      <div className="mt-10">
        <GlyphRainVariantsSection />
      </div>
    </>
  );
}
