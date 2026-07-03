"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import {
  COLS,
  ROWS,
  NEXT_COLS,
  NEXT_ROWS,
  TetrisEngine,
  type TetrisPalette,
} from "./engine";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  HistoryPoint,
  TetrisGameApi,
  TetrisGameState,
  TetrisInput,
  UseTetrisGameOptions,
} from "./types";

/** rAF is throttled in background tabs; this ticker keeps the sim breathing (like Snake). */
const FALLBACK_MS = 120;
const FALLBACK_GAP = 180;

const INITIAL_STATE: TetrisGameState = {
  screen: "menu",
  paused: false,
  score: 0,
  lines: 0,
  level: 0,
  best: 0,
  isNewBest: false,
  rank: 0,
};

/** Parse `#rgb` / `#rrggbb` → `[r,g,b]`; falls back to a light gray on anything odd. */
function parseHexRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [220, 220, 220];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Resolve the theme-native draw palette from the live `--m-*` tokens on `el` (the board
 * scope — custom props inherit, so reading the canvas works even though the tokens are
 * declared on a `.mono-scope` ancestor):
 *   bg ← `--m-bg` · piece + flash ← `--m-accent` · stack ← `--m-muted2` ·
 *   grid ← `--m-fg` at a low alpha (a hair higher when fg is dark — i.e. the light
 *   theme — so the dark hairline stays as subtle as the light one is on dark).
 */
function resolvePalette(el: Element): TetrisPalette {
  const cs = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  const accent = read("--m-accent", "#cdff48");
  const [r, g, b] = parseHexRgb(read("--m-fg", "#dcdcdc"));
  const alpha = r + g + b < 384 ? 0.07 : 0.05; // dark fg ⇒ light theme ⇒ a touch more
  return {
    boardBg: read("--m-bg", "#181818"),
    pieceFill: accent,
    flashAccent: accent,
    lockedFill: read("--m-muted2", "#7a7a7a"),
    gridLine: `rgba(${r},${g},${b},${alpha})`,
  };
}

/**
 * CLASSIC TETRIS as a React hook. Owns one {@link TetrisEngine}, drives it with a
 * wall-clock delta over rAF (+ a throttled-tab `setInterval` fallback), wires the
 * keyboard (held moves + one-shot rotate edges, native auto-repeat suppressed), draws
 * both canvases imperatively, and projects engine outcomes onto React state only when
 * a HUD value changes. Full teardown (rAF / interval / listeners). Mirrors the
 * Snake/Hollow-Sloth lifecycle discipline (one engine, no per-frame React re-render).
 *
 * Server `best`/`rank` are fed in by `useTetrisArcade`; `onGameOver(score)` fires once
 * per run to submit + log.
 */
export function useTetrisGame({
  best = 0,
  onGameOver,
}: UseTetrisGameOptions = {}): TetrisGameApi {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<TetrisEngine | null>(null);
  const getEngine = () => {
    engineRef.current ??= new TetrisEngine();
    return engineRef.current;
  };

  const [state, setState] = useState<TetrisGameState>(INITIAL_STATE);
  const [history, setHistory] = useState<HistoryPoint[]>(() =>
    recentSeries([])
  );

  // Mutable mirrors so the loop / key handler read fresh values without re-subscribing.
  const screenRef = useRef(state.screen);
  const pausedRef = useRef(state.paused);
  const bestRef = useRef(best);
  const onGameOverRef = useRef(onGameOver);
  // Single score-log source the game-over handler appends to (no double-count on re-render).
  const historyRef = useRef<number[]>([]);
  // Guards handleGameOver to fire ONCE per run: `update` keeps returning dead every
  // frame once over, but `screenRef` only flips after a React commit (a frame or two
  // later), so without this the append + submit would fire on each of those frames.
  const endedRef = useRef(false);

  useEffect(() => {
    screenRef.current = state.screen;
    pausedRef.current = state.paused;
  }, [state.screen, state.paused]);

  useEffect(() => {
    bestRef.current = best;
    onGameOverRef.current = onGameOver;
  }, [best, onGameOver]);

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

  // Live input the loop feeds the engine. Rotate edges are consumed (cleared) by the engine.
  const inputRef = useRef<TetrisInput>({
    left: false,
    right: false,
    softDrop: false,
    rotateCW: false,
    rotateCCW: false,
  });
  // Physical keys held — to emit clean press EDGES (ignore native auto-repeat).
  const heldRef = useRef<Set<string>>(new Set());

  const resetInput = () => {
    const input = inputRef.current;
    input.left =
      input.right =
      input.softDrop =
      input.rotateCW =
      input.rotateCCW =
        false;
    heldRef.current.clear();
  };

  const start = useCallback(() => {
    getEngine().reset();
    resetInput();
    endedRef.current = false;
    setState((s) => ({
      ...s,
      screen: "playing",
      paused: false,
      score: 0,
      lines: 0,
      level: 0,
      isNewBest: false,
      rank: 0,
    }));
  }, []);

  const togglePause = useCallback(() => {
    if (screenRef.current !== "playing") return;
    resetInput(); // drop held keys so the piece doesn't lurch on resume
    setState((s) => ({ ...s, paused: !s.paused }));
  }, []);

  // Fires exactly ONCE per run: the engine reports `dead`, the screen flips to "over"
  // so the sim no longer advances — the append + submit happen once.
  const handleGameOver = useCallback((score: number) => {
    const log = recordScore(historyRef.current, score);
    historyRef.current = log;
    setHistory(recentSeries(log));
    onGameOverRef.current?.(score);
    setState((s) => ({
      ...s,
      screen: "over",
      paused: false,
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
    const nextCtx = nextCanvasRef.current?.getContext("2d") ?? null;

    // DPR-aware backing stores (crisp solid cells + a true 1px grid; NO pixelated
    // upscale). We reason in CSS px and pre-scale each ctx by `dpr`.
    //
    // The WELL is sized by JS to an EXACT 10×20 multiple of a single square cell —
    // otherwise the CSS box rounds to a size that isn't precisely 1:2 and `ROWS·cell`
    // falls short of the height, leaving a dead strip at the bottom. We measure the
    // available box from the flex ROW (the canvas's parent) minus its padding, the
    // inter-column gap and the stats panel's width — all read from the DOM, no
    // hardcoded layout constants — then set the canvas to `cell·COLS × cell·ROWS`. The
    // ResizeObserver watches the ROW (the canvas size is now JS-driven, so observing
    // the canvas itself would never fire), keeping it exact under layout + DPR changes.
    let cssW = 0;
    let cssH = 0;
    let nCssW = 0;
    let nCssH = 0;
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
        const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
        const panelW = panelRef.current?.offsetWidth ?? 0;
        availH = Math.max(0, host.clientHeight - padY);
        availW = Math.max(0, host.clientWidth - padX - gap - panelW);
      }
      // Largest square cell fitting both dimensions; the element is then an exact
      // multiple of it, so the 10×20 grid fills edge-to-edge with no leftover strip.
      const hLimit = availH > 0 ? availH / ROWS : Infinity;
      const wLimit = availW > 0 ? availW / COLS : Infinity;
      let cell = Math.min(hLimit, wLimit);
      if (!Number.isFinite(cell) || cell <= 0) cell = 24;
      cssW = cell * COLS;
      cssH = cell * ROWS;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // NEXT cells are 1:1 with the WELL's (owner call): the square preview canvas
      // is sized to `NEXT_COLS·cell`, so the piece renders at true in-game scale.
      // JS-driven like the well; the CSS `size-16` is only the pre-hydration
      // fallback. (The panel is measured BEFORE this write; the ResizeObserver on
      // the canvas re-runs resize once after the change, and the height-bound cell
      // math converges immediately.)
      const nc = nextCanvasRef.current;
      if (nc && nextCtx) {
        const nw = cell * NEXT_COLS;
        const nh = cell * NEXT_ROWS;
        nc.style.width = `${nw}px`;
        nc.style.height = `${nh}px`;
        nc.width = Math.round(nw * dpr);
        nc.height = Math.round(nh * dpr);
        nextCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        nCssW = nw;
        nCssH = nh;
      }
    };
    resize();

    // Repaint both canvases with the current engine state + palette. Shared so a theme
    // change can force an immediate repaint of the static menu/paused/over screens.
    const paint = () => {
      engine.drawWell(ctx, cssW, cssH, dpr);
      if (nextCtx) engine.drawNext(nextCtx, nCssW, nCssH, dpr);
    };

    // THEME-NATIVE palette: resolve the concrete colours from the live `--m-*` tokens
    // (the canvas inherits them from the `.mono-scope` board) and re-resolve whenever the
    // theme flips — `.dark` toggles on <html>, so watch its `class` attribute. On change
    // we swap the palette and repaint immediately (no setState — the repo lint rule bans
    // synchronous setState in effects — just an imperative canvas redraw).
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
    if (nextCanvasRef.current) ro.observe(nextCanvasRef.current);

    let last = performance.now();
    let lastFrame = last;
    let rafId = 0;

    const tick = (now: number) => {
      lastFrame = now;
      const dt = now - last;
      last = now;
      const animate = !prefersReducedMotion();
      const screen = screenRef.current;

      if (screen === "playing" && !pausedRef.current && !endedRef.current) {
        const res = engine.update(dt, inputRef.current, animate);
        if (res.dead) {
          endedRef.current = true;
          handleGameOver(res.score);
        } else {
          setState((s) =>
            s.score === res.score &&
            s.lines === res.lines &&
            s.level === res.level
              ? s
              : { ...s, score: res.score, lines: res.lines, level: res.level }
          );
        }
      }
      // Always repaint (menu / paused / over draw the static field too).
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
    const isLeft = (c: string, k: string) => c === "KeyA" || k === "ArrowLeft";
    const isRight = (c: string, k: string) =>
      c === "KeyD" || k === "ArrowRight";
    const isSoft = (c: string, k: string) => c === "KeyS" || k === "ArrowDown";
    const isRotateCW = (c: string, k: string) =>
      c === "KeyX" || k === "ArrowUp";
    const isRotateCCW = (c: string) => c === "KeyZ";
    // Space is THE pause key (parity with both snakes — one pause key across the
    // arcade; ESC/P removed by owner call). On menu/over it still starts —
    // isStart runs first there.
    const isPause = (c: string, k: string) => c === "Space" || k === " ";
    const isStart = (c: string, k: string) =>
      c === "Enter" || c === "Space" || k === " ";

    const onKeyDown = (e: KeyboardEvent) => {
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
      const c = e.code;
      const k = e.key;
      const input = inputRef.current;

      if (
        isLeft(c, k) ||
        isRight(c, k) ||
        isSoft(c, k) ||
        isRotateCW(c, k) ||
        k === " "
      ) {
        e.preventDefault();
      }

      // Menu / over → start.
      if (screenRef.current !== "playing") {
        if (isStart(c, k)) start();
        return;
      }
      if (isPause(c, k)) {
        togglePause();
        return;
      }
      if (pausedRef.current) return; // paused: only Esc/P above reacts

      const fresh = !heldRef.current.has(c);
      heldRef.current.add(c);

      if (isLeft(c, k)) input.left = true;
      if (isRight(c, k)) input.right = true;
      if (isSoft(c, k)) input.softDrop = true;
      // Rotations are edge-only — one per physical press (suppress native repeat).
      if (fresh && isRotateCW(c, k)) input.rotateCW = true;
      if (fresh && isRotateCCW(c)) input.rotateCCW = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const c = e.code;
      const k = e.key;
      heldRef.current.delete(c);
      const input = inputRef.current;
      if (isLeft(c, k)) input.left = false;
      if (isRight(c, k)) input.right = false;
      if (isSoft(c, k)) input.softDrop = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [start, togglePause]);

  return {
    state,
    canvasRef,
    nextCanvasRef,
    panelRef,
    history,
    start,
    togglePause,
  };
}
