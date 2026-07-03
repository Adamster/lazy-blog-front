"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { Engine2048, GRID, parseHexRgb, type Palette2048 } from "./engine";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  Direction,
  Game2048Api,
  Game2048State,
  HistoryPoint,
  Input2048,
  Use2048GameOptions,
} from "./types";

/** rAF is throttled in background tabs; this ticker keeps the anim finishing (like Tetris). */
const FALLBACK_MS = 120;
const FALLBACK_GAP = 180;
/** Minimum swipe travel (CSS px) before a touch counts as a slide. */
const SWIPE_MIN_PX = 24;

const INITIAL_STATE: Game2048State = {
  screen: "menu",
  score: 0,
  moves: 0,
  best: 0,
  isNewBest: false,
  rank: 0,
};

/**
 * Resolve the theme-native draw palette from the live `--m-*` tokens on `el` (custom
 * props inherit, so reading the canvas works even though the tokens live on a
 * `.mono-scope` ancestor). Same grid-alpha trick as Tetris: a hair more alpha when fg
 * is dark (light theme) so the hairline stays equally subtle on both themes.
 */
function resolvePalette(el: Element): Palette2048 {
  const cs = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  const [r, g, b] = parseHexRgb(read("--m-fg", "#dcdcdc"));
  const alpha = r + g + b < 384 ? 0.07 : 0.05;
  return {
    boardBg: read("--m-bg", "#181818"),
    gridLine: `rgba(${r},${g},${b},${alpha})`,
    fg: read("--m-fg", "#dcdcdc"),
    dim: read("--m-dim", "#383838"),
    muted2: read("--m-muted2", "#7a7a7a"),
    accent: read("--m-accent", "#cdff48"),
    displayFont: read(
      "--font-display",
      '"Space Grotesk", system-ui, sans-serif'
    ),
  };
}

/** Map a key event to a slide direction (arrows / WASD), or null. */
function dirFor(code: string, key: string): Direction | null {
  if (code === "KeyA" || key === "ArrowLeft") return "left";
  if (code === "KeyD" || key === "ArrowRight") return "right";
  if (code === "KeyW" || key === "ArrowUp") return "up";
  if (code === "KeyS" || key === "ArrowDown") return "down";
  return null;
}

/**
 * CLASSIC 2048 as a React hook. Owns one {@link Engine2048}, drives it with a
 * wall-clock delta over rAF (+ a throttled-tab fallback), wires keyboard (arrows/WASD
 * one-shot edges) + touch swipes, draws the canvas imperatively, and projects engine
 * outcomes onto React state only when a HUD value changes. Full teardown. Mirrors the
 * Tetris lifecycle discipline (one engine, no per-frame React re-render).
 *
 * Server `best`/`rank` are fed in by `use2048Arcade`; `onGameOver(score)` fires once
 * per run to submit + log; `onWin(score)` fires once at the first 2048 (early submit).
 */
export function use2048Game({
  best = 0,
  onGameOver,
  onWin,
}: Use2048GameOptions = {}): Game2048Api {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine2048 | null>(null);
  const getEngine = () => {
    engineRef.current ??= new Engine2048();
    return engineRef.current;
  };

  const [state, setState] = useState<Game2048State>(INITIAL_STATE);
  const [history, setHistory] = useState<HistoryPoint[]>(() =>
    recentSeries([])
  );

  // Mutable mirrors so the loop / key handler read fresh values without re-subscribing.
  const screenRef = useRef(state.screen);
  const bestRef = useRef(best);
  const onGameOverRef = useRef(onGameOver);
  const onWinRef = useRef(onWin);
  // Single score-log source the game-over handler appends to (no double-count on re-render).
  const historyRef = useRef<number[]>([]);
  // One-shot guards per run: the engine keeps reporting over/won every frame until the
  // React commit flips the screen, so these keep the submit/notify single-fire.
  const endedRef = useRef(false);
  const wonNotifiedRef = useRef(false);

  useEffect(() => {
    screenRef.current = state.screen;
  }, [state.screen]);

  useEffect(() => {
    bestRef.current = best;
    onGameOverRef.current = onGameOver;
    onWinRef.current = onWin;
  }, [best, onGameOver, onWin]);

  // Reflect the incoming server best into state. Deferred via rAF — repo lint rule:
  // no synchronous setState inside an effect.
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setState((s) => (s.best === best ? s : { ...s, best }))
    );
    return () => cancelAnimationFrame(raf);
  }, [best]);

  // Hydrate the log from localStorage on mount; deferred via rAF (repo lint rule).
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const log = loadHistory();
      historyRef.current = log;
      setHistory(recentSeries(log));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // One-shot direction edge the loop feeds the engine (consumed there).
  const inputRef = useRef<Input2048>({ dir: null });
  const resetInput = () => {
    inputRef.current.dir = null;
  };

  const start = useCallback(() => {
    getEngine().reset();
    resetInput();
    endedRef.current = false;
    wonNotifiedRef.current = false;
    setState((s) => ({
      ...s,
      screen: "playing",
      score: 0,
      moves: 0,
      isNewBest: false,
      rank: 0,
    }));
  }, []);

  const continueRun = useCallback(() => {
    getEngine().continueRun();
    resetInput();
    setState((s) => (s.screen === "won" ? { ...s, screen: "playing" } : s));
  }, []);

  // Fires exactly ONCE per run (see endedRef).
  const handleGameOver = useCallback((score: number) => {
    const log = recordScore(historyRef.current, score);
    historyRef.current = log;
    setHistory(recentSeries(log));
    onGameOverRef.current?.(score);
    setState((s) => ({
      ...s,
      screen: "over",
      isNewBest: score > 0 && score > bestRef.current,
    }));
  }, []);

  // ---------- the loop ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const engine = getEngine();

    // DPR-aware backing store; the canvas is JS-sized to an EXACT 4×4 multiple of a
    // square cell (same discipline as the Tetris well — no leftover strip, crisp
    // device-pixel-snapped tiles). The board sits ALONE in the flex ROW (run stats
    // live in the top band), so the fit is just the row box minus its padding; the
    // ResizeObserver watches the ROW.
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;

    const host = canvas.parentElement;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      let availH = 480;
      let availW = Infinity;
      if (host) {
        const cs = getComputedStyle(host);
        const padX =
          parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) || 0;
        const padY =
          parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) || 0;
        availH = Math.max(0, host.clientHeight - padY);
        availW = Math.max(0, host.clientWidth - padX);
      }
      const hLimit = availH > 0 ? availH / GRID : Infinity;
      const wLimit = availW > 0 ? availW / GRID : Infinity;
      let cell = Math.min(hLimit, wLimit);
      if (!Number.isFinite(cell) || cell <= 0) cell = 96;
      cssW = cssH = cell * GRID;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const paint = () => {
      engine.draw(ctx, cssW, cssH, dpr);
    };

    // THEME-NATIVE palette: resolve from the live tokens, re-resolve when `.dark`
    // flips on <html>, repaint imperatively (no setState — repo lint rule).
    engine.setPalette(resolvePalette(canvas));
    const themeObserver = new MutationObserver(() => {
      engine.setPalette(resolvePalette(canvas));
      paint();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const ro = new ResizeObserver(() => resize());
    if (host) ro.observe(host);

    let last = performance.now();
    let lastFrame = last;
    let rafId = 0;

    const tick = (now: number) => {
      lastFrame = now;
      const dt = now - last;
      last = now;
      const animate = !prefersReducedMotion();

      if (screenRef.current === "playing" && !endedRef.current) {
        const res = engine.update(dt, inputRef.current, animate);
        if (res.phase === "over") {
          endedRef.current = true;
          setState((s) => ({ ...s, score: res.score, moves: res.moves }));
          handleGameOver(res.score);
        } else if (res.phase === "won") {
          if (!wonNotifiedRef.current) {
            wonNotifiedRef.current = true;
            onWinRef.current?.(res.score);
            setState((s) => ({
              ...s,
              screen: "won",
              score: res.score,
              moves: res.moves,
            }));
          }
        } else {
          setState((s) =>
            s.score === res.score && s.moves === res.moves
              ? s
              : { ...s, score: res.score, moves: res.moves }
          );
        }
      } else {
        // Overlay screens (menu/won/over) still finish the landing slide/pop —
        // the winning 2048 tile must appear behind the scrim, not freeze mid-flight.
        engine.tickAnim(dt);
      }
      // Always repaint (menu / won / over draw the static field too).
      paint();
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
  }, [handleGameOver]);

  // ---------- keyboard ----------
  useEffect(() => {
    const isStart = (c: string, k: string) =>
      c === "Enter" || c === "Space" || k === " ";

    const onKeyDown = (e: KeyboardEvent) => {
      // Never hijack typing, and let a FOCUSED button/link keep its native
      // Enter/Space activation (the won overlay has TWO actions — routing a
      // focused "New game" Space press to Continue would misfire).
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "BUTTON" ||
          el.tagName === "A" ||
          el.isContentEditable)
      ) {
        return;
      }
      const dir = dirFor(e.code, e.key);
      if (dir || e.key === " ") e.preventDefault();

      const screen = screenRef.current;
      if (screen === "menu" || screen === "over") {
        if (isStart(e.code, e.key)) start();
        return;
      }
      if (screen === "won") {
        if (isStart(e.code, e.key)) continueRun();
        return;
      }
      if (dir) inputRef.current.dir = dir;
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [start, continueRun]);

  // ---------- touch (swipe on the canvas; CSS `touch-none` stops page scroll) ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let sx = 0;
    let sy = 0;
    let active = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      sx = t.clientX;
      sy = t.clientY;
      active = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN_PX) return;
      if (screenRef.current !== "playing") return;
      inputRef.current.dir =
        Math.abs(dx) >= Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up";
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return { state, canvasRef, history, start, continueRun };
}
