"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import {
  GRID_H,
  GRID_W,
  INITIAL_LENGTH,
  lerpHex,
  SnakeClassicEngine,
  type SnakeClassicPalette,
} from "./engine";
import { GUEST_SCOPE } from "@/features/arcade/shared";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  HistoryPoint,
  SnakeClassicGameApi,
  SnakeClassicGameState,
  UseSnakeClassicGameOptions,
} from "./types";

/** rAF can be throttled in background tabs — this ticker keeps the sim alive. */
const FALLBACK_MS = 120;
const FALLBACK_GAP = 180;

/** Parse `#rgb` / `#rrggbb` → `[r,g,b]`; falls back to a light gray on anything odd. */
function parseHexRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [220, 220, 220];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Resolve the theme-native draw palette from the live `--m-*` tokens on `el` (the
 * board scope — custom props inherit, so reading the canvas works even though the
 * tokens are declared on a `.mono-scope` ancestor): field ← `--m-bg` · head ←
 * `--m-accent` (tail = the accent pulled toward the field) · food ← `--m-fg` ·
 * grid ← `--m-fg` at a low alpha (a hair higher when fg is dark — i.e. the light
 * theme — so the dark hairline stays as subtle as the light one is on dark) ·
 * frame ← `--m-error` (all four walls are lethal here too — same reasoning as the
 * Rabbit board's red `border-2`, just drawn IN-canvas instead of a DOM border).
 */
function resolvePalette(el: Element): SnakeClassicPalette {
  const cs = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  const accent = read("--m-accent", "#cdff48");
  const bg = read("--m-bg", "#181818");
  const [r, g, b] = parseHexRgb(read("--m-fg", "#dcdcdc"));
  const gridAlpha = r + g + b < 384 ? 0.07 : 0.05; // dark fg ⇒ light theme ⇒ a touch more
  return {
    boardBg: bg,
    snakeHead: accent,
    snakeTail: lerpHex(accent, bg, 0.55),
    food: read("--m-fg", "#e6e6e6"),
    gridLine: `rgba(${r},${g},${b},${gridAlpha})`,
    frameLine: read("--m-error", "#ff5d5d"),
  };
}

const INITIAL_STATE: SnakeClassicGameState = {
  screen: "menu",
  paused: false,
  score: 0,
  best: 0,
  length: INITIAL_LENGTH,
  eaten: 0,
  isNewBest: false,
  rank: 0,
};

/**
 * The classic-Snake engine as a React hook. Owns one {@link SnakeClassicEngine},
 * runs the rAF render loop (+ a `setInterval` fallback for throttled tabs), wires
 * the keyboard / resize listeners, and projects engine events onto React state.
 *
 * Data-layer split: the engine owns the LIVE run + the localStorage sparkline;
 * the board, `best` and `rank` are server-truth, fed in by `useSnakeClassicArcade`
 * (which also takes `onGameOver(score)` once per run to submit).
 */
export function useSnakeClassicGame({
  speed = "classic",
  best = 0,
  onGameOver,
  historyScope = GUEST_SCOPE,
}: UseSnakeClassicGameOptions = {}): SnakeClassicGameApi {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Lazy getter keeps engine creation out of the render body (the compiler forbids
  // reading/writing refs during render).
  const engineRef = useRef<SnakeClassicEngine | null>(null);
  const getEngine = () => {
    engineRef.current ??= new SnakeClassicEngine(speed);
    return engineRef.current;
  };

  const [state, setState] = useState<SnakeClassicGameState>(INITIAL_STATE);
  const [history, setHistory] = useState<HistoryPoint[]>(() =>
    recentSeries([])
  );

  // Mutable mirrors so the rAF loop / key handler / game-over read fresh values
  // without re-subscribing (synced in effects, never written during render).
  const screenRef = useRef(state.screen);
  const pausedRef = useRef(state.paused);
  const bestRef = useRef(best);
  const onGameOverRef = useRef(onGameOver);
  const historyScopeRef = useRef(historyScope);
  // The single score-log source the game-over handler appends to, so a re-render can't double-count.
  const historyRef = useRef<number[]>([]);
  useEffect(() => {
    screenRef.current = state.screen;
    pausedRef.current = state.paused;
  }, [state.screen, state.paused]);

  useEffect(() => {
    bestRef.current = best;
    onGameOverRef.current = onGameOver;
    historyScopeRef.current = historyScope;
  }, [best, onGameOver, historyScope]);

  // Reflect the incoming server best into state. Deferred via rAF — repo lint rule:
  // no synchronous setState inside an effect.
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setState((s) => (s.best === best ? s : { ...s, best }))
    );
    return () => cancelAnimationFrame(raf);
  }, [best]);

  // Keep the speed preset live without recreating the engine.
  useEffect(() => {
    getEngine().setSpeed(speed);
    // getEngine is a stable closure over refs; only the option value matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  // Hydrate the log from localStorage on mount + whenever the identity scope
  // changes (login/logout swaps in that identity's log); rAF-deferred (lint rule).
  useEffect(() => {
    let raf = 0;
    raf = requestAnimationFrame(() => {
      const log = loadHistory(historyScope);
      historyRef.current = log;
      setHistory(recentSeries(log));
    });
    return () => cancelAnimationFrame(raf);
  }, [historyScope]);

  const steer = useCallback((x: number, y: number) => {
    if (screenRef.current !== "playing" || pausedRef.current) return;
    getEngine().steer(x, y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    getEngine().reset();
    setState((s) => ({
      ...s,
      screen: "playing",
      paused: false,
      score: 0,
      length: INITIAL_LENGTH,
      eaten: 0,
      isNewBest: false,
      rank: 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePause = useCallback(() => {
    if (screenRef.current !== "playing") return;
    setState((s) => ({ ...s, paused: !s.paused }));
  }, []);

  // Fires exactly ONCE per run: the engine reports `dead` on one step, then `screen`
  // flips to "over" so `engine.step` no longer runs — the append + submit happen once.
  const handleGameOver = useCallback((score: number) => {
    const log = recordScore(historyScopeRef.current, historyRef.current, score);
    historyRef.current = log;
    setHistory(recentSeries(log));
    onGameOverRef.current?.(score);
    setState((s) => ({
      ...s,
      screen: "over",
      paused: false,
      // Optimistic new-best vs our held server best; the submit reconciles it.
      isNewBest: score > 0 && score > bestRef.current,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = getEngine();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let lastStep = 0;
    let lastFrame = 0;
    let rafId = 0;

    // JS-SIZED like the Tetris well (owner-caught regressions killed the CSS
    // takes: iOS can't resolve % heights against an aspect-ratio parent, and
    // the absolute/aspect variant broke desktop): measure the HOST's content
    // box, contain-fit the 5:3 grid, write INLINE px — deterministic in
    // normal mode and fullscreen alike (in fullscreen the host IS the
    // viewport, so this also replaces the old CSS min() clamp).
    const host = canvas.parentElement;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      let availW = 760;
      let availH = (availW * GRID_H) / GRID_W;
      if (host) {
        const cs = getComputedStyle(host);
        const padX =
          (parseFloat(cs.paddingLeft) || 0) +
          (parseFloat(cs.paddingRight) || 0);
        const padY =
          (parseFloat(cs.paddingTop) || 0) +
          (parseFloat(cs.paddingBottom) || 0);
        availW = Math.max(0, host.clientWidth - padX) || availW;
        availH = Math.max(0, host.clientHeight - padY) || availH;
      }
      const w = Math.min(availW, (availH * GRID_W) / GRID_H);
      const h = (w * GRID_H) / GRID_W;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cssW = w;
      cssH = h;
    };
    resize();

    // THEME-NATIVE palette (the Tetris pattern): resolve the concrete colours from the
    // live `--m-*` tokens and re-resolve whenever the theme flips — `.dark` toggles on
    // <html>, so watch its `class` attribute. No explicit repaint needed: the rAF loop
    // below redraws every frame (menu included, via drawIdle).
    engine.setPalette(resolvePalette(canvas));
    const themeObserver = new MutationObserver(() => {
      engine.setPalette(resolvePalette(canvas));
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const ro = new ResizeObserver(() => resize());
    ro.observe(host ?? canvas);

    const tick = (now: number) => {
      lastFrame = now;
      if (
        Math.abs(canvas.clientWidth - cssW) > 1 ||
        Math.abs(canvas.clientHeight - cssH) > 1
      ) {
        resize();
      }
      const animate = !prefersReducedMotion();
      const screen = screenRef.current;

      if (screen === "playing" && !pausedRef.current) {
        if (now - lastStep >= engine.stepInterval) {
          lastStep = now;
          const result = engine.step();
          if (result.dead) {
            handleGameOver(result.score);
          } else {
            setState((s) =>
              s.score === result.score &&
              s.length === result.length &&
              s.eaten === result.eaten
                ? s
                : {
                    ...s,
                    score: result.score,
                    length: result.length,
                    eaten: result.eaten,
                  }
            );
          }
        }
        engine.drawGame(ctx, cssW, cssH, dpr, animate);
      } else if (screen === "over" || pausedRef.current) {
        engine.drawGame(ctx, cssW, cssH, dpr, false);
      } else {
        engine.drawIdle(ctx, cssW, cssH);
      }
    };

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      tick(now);
    };
    rafId = requestAnimationFrame(loop);

    const fallback = window.setInterval(() => {
      const now = performance.now();
      if (now - lastFrame > FALLBACK_GAP) tick(now);
    }, FALLBACK_MS);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearInterval(fallback);
      ro.disconnect();
      themeObserver.disconnect();
    };
    // getEngine is a stable closure over refs (intentionally omitted).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGameOver]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Never hijack typing in a field (defensive — no inputs on the page).
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }

      const k = e.key;
      // WASD matched on `e.code` (the PHYSICAL key), not `e.key`: on a non-Latin
      // layout `e.key` yields "ц/ф/ы/в", so a key-based check silently fails.
      // `e.code` is layout-independent. Arrows stay on `e.key` (already layout-independent).
      const c = e.code;
      const isArrow =
        k === "ArrowUp" ||
        k === "ArrowDown" ||
        k === "ArrowLeft" ||
        k === "ArrowRight";
      if (isArrow || k === " ") e.preventDefault();

      if (screenRef.current !== "playing") {
        if (k === "Enter" || k === " ") start();
        return;
      }
      if (k === " ") {
        togglePause();
        return;
      }
      if (k === "ArrowUp" || c === "KeyW") steer(0, -1);
      else if (k === "ArrowDown" || c === "KeyS") steer(0, 1);
      else if (k === "ArrowLeft" || c === "KeyA") steer(-1, 0);
      else if (k === "ArrowRight" || c === "KeyD") steer(1, 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, togglePause, steer]);

  return {
    state,
    canvasRef,
    history,
    start,
    togglePause,
    steer,
  };
}
