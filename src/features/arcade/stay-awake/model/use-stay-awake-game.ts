"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import {
  COLS,
  ROWS,
  StayAwakeEngine,
  WAVE_START_GAP,
  type StayAwakePalette,
} from "./engine";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  HistoryPoint,
  HopDir,
  StayAwakeGameApi,
  StayAwakeInput,
  StayAwakeState,
  UseStayAwakeGameOptions,
} from "./types";
import { GUEST_SCOPE } from "@/features/arcade/shared";

/** rAF is throttled in background tabs; this ticker keeps the wave honest. */
const FALLBACK_MS = 120;
const FALLBACK_GAP = 180;

/** Beat between death and the game-over overlay, so the death burst is SEEN
 *  (chips live ~0.6s). Skipped under reduced motion — there's no burst. */
const GAME_OVER_DELAY_MS = 700;

const INITIAL_STATE: StayAwakeState = {
  screen: "menu",
  paused: false,
  score: 0,
  altitude: 0,
  coffees: 0,
  cause: null,
  waveGap: WAVE_START_GAP,
  rushActive: false,
  shotSecondsLeft: 0,
  best: 0,
  isNewBest: false,
  rank: 0,
};

/** Parse `#rgb` / `#rrggbb` → `[r,g,b]`; falls back to a light gray. */
function parseHexRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [220, 220, 220];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Resolve the theme-native draw palette from the live `--m-*` tokens (custom
 *  props inherit, so reading the canvas works). Same grid-alpha trick as the
 *  other boards: a hair more alpha when fg is dark (light theme). */
function resolvePalette(el: Element): StayAwakePalette {
  const cs = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  const [r, g, b] = parseHexRgb(read("--m-fg", "#dcdcdc"));
  const alpha = r + g + b < 384 ? 0.07 : 0.05;
  return {
    boardBg: read("--m-bg", "#181818"),
    fg: read("--m-fg", "#dcdcdc"),
    accent: read("--m-accent", "#cdff48"),
    error: read("--m-error", "#ff5d5d"),
    muted: read("--m-muted", "#9a9a9a"),
    muted2: read("--m-muted2", "#7a7a7a"),
    gridLine: `rgba(${r},${g},${b},${alpha})`,
  };
}

/** Map a key event to a hop, or null. WASD via `e.code` (layout-proof). */
function hopFor(code: string, key: string): HopDir | null {
  if (code === "KeyA" || key === "ArrowLeft") return "left";
  if (code === "KeyD" || key === "ArrowRight") return "right";
  return null;
}

/**
 * STAY AWAKE as a React hook. Owns one {@link StayAwakeEngine}, drives it with a
 * wall-clock delta over rAF (+ a throttled-tab fallback), wires keyboard (one-shot
 * hop edges, Space pause) and exposes `hop()` for the board's tap zones, resolves
 * the theme palette, draws imperatively, and projects engine outcomes onto React
 * state ONLY on discrete changes (never per frame — rushMsLeft is coarsened to a
 * boolean). Full teardown. Mirrors the Tetris/2048 lifecycle discipline.
 */
export function useStayAwakeGame({
  best = 0,
  onGameOver,
  historyScope = GUEST_SCOPE,
}: UseStayAwakeGameOptions = {}): StayAwakeGameApi {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<StayAwakeEngine | null>(null);
  const getEngine = () => {
    engineRef.current ??= new StayAwakeEngine();
    return engineRef.current;
  };

  const [state, setState] = useState<StayAwakeState>(INITIAL_STATE);
  const [history, setHistory] = useState<HistoryPoint[]>(() =>
    recentSeries([])
  );

  // Mutable mirrors so the loop / key handler read fresh values without re-subscribing.
  const screenRef = useRef(state.screen);
  const pausedRef = useRef(state.paused);
  const bestRef = useRef(best);
  const onGameOverRef = useRef(onGameOver);
  const historyScopeRef = useRef(historyScope);
  const historyRef = useRef<number[]>([]);
  /** One-shot guard: the engine reports `over` every frame until React commits. */
  const endedRef = useRef(false);
  /** The pending death→overlay beat (cleared on unmount/restart). */
  const gameOverTimerRef = useRef<number | null>(null);

  useEffect(() => {
    screenRef.current = state.screen;
    pausedRef.current = state.paused;
  }, [state.screen, state.paused]);

  useEffect(() => {
    bestRef.current = best;
    onGameOverRef.current = onGameOver;
    historyScopeRef.current = historyScope;
  }, [best, onGameOver, historyScope]);

  // Reflect the incoming server best into state. Deferred via rAF — repo lint
  // rule: no synchronous setState inside an effect.
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setState((s) => (s.best === best ? s : { ...s, best }))
    );
    return () => cancelAnimationFrame(raf);
  }, [best]);

  // Hydrate the sparkline log from localStorage on mount (deferred via rAF).
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const log = loadHistory(historyScope);
      historyRef.current = log;
      setHistory(recentSeries(log));
    });
    return () => cancelAnimationFrame(raf);
  }, [historyScope]);

  // One-shot hop edge the loop feeds the engine (consumed there).
  const inputRef = useRef<StayAwakeInput>({ dir: null });

  const start = useCallback(() => {
    getEngine().reset();
    inputRef.current.dir = null;
    endedRef.current = false;
    setState((s) => ({
      ...s,
      screen: "playing",
      paused: false,
      score: 0,
      altitude: 0,
      coffees: 0,
      cause: null,
      waveGap: WAVE_START_GAP,
      rushActive: false,
      shotSecondsLeft: 0,
      isNewBest: false,
      rank: 0,
    }));
  }, []);

  const hop = useCallback((dir: HopDir) => {
    if (screenRef.current !== "playing" || pausedRef.current) return;
    inputRef.current.dir = dir;
  }, []);

  const togglePause = useCallback(() => {
    // endedRef: no pausing inside the death→overlay beat.
    if (screenRef.current !== "playing" || endedRef.current) return;
    setState((s) => ({ ...s, paused: !s.paused }));
  }, []);

  // Fires exactly ONCE per run (see endedRef).
  const handleGameOver = useCallback((score: number) => {
    const log = recordScore(historyScopeRef.current, historyRef.current, score);
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

    // DPR-aware backing store; the well is JS-sized to an EXACT 5×12 multiple
    // of a square cell (the Tetris discipline). Measured from the flex ROW minus
    // its padding, the two column gaps and both side panels' widths.
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
        const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
        const panelsW =
          (leftPanelRef.current?.offsetWidth ?? 0) +
          (rightPanelRef.current?.offsetWidth ?? 0);
        availH = Math.max(0, host.clientHeight - padY);
        availW = Math.max(0, host.clientWidth - padX - gap * 2 - panelsW);
      }
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
    };
    resize();

    // THEME-NATIVE palette: resolve from the live tokens, re-resolve when `.dark`
    // flips on <html>; the rAF loop repaints every frame so no forced redraw needed.
    engine.setPalette(resolvePalette(canvas));
    const themeObserver = new MutationObserver(() => {
      engine.setPalette(resolvePalette(canvas));
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

      if (
        screenRef.current === "playing" &&
        !pausedRef.current &&
        !endedRef.current
      ) {
        const res = engine.update(dt, inputRef.current, animate);
        if (res.phase === "over") {
          endedRef.current = true;
          setState((s) => ({
            ...s,
            score: res.score,
            altitude: res.altitude,
            coffees: res.coffees,
            cause: res.cause,
            waveGap: res.waveGap,
            rushActive: false,
            shotSecondsLeft: 0,
          }));
          // Hold the overlay one beat so the death burst plays out on the board.
          gameOverTimerRef.current = window.setTimeout(
            () => handleGameOver(res.score),
            animate ? GAME_OVER_DELAY_MS : 0
          );
        } else {
          const rushActive = res.rushMsLeft > 0;
          const shotSecondsLeft = Math.ceil(res.shotMsLeft / 1000);
          setState((s) =>
            s.score === res.score &&
            s.altitude === res.altitude &&
            s.coffees === res.coffees &&
            s.waveGap === res.waveGap &&
            s.rushActive === rushActive &&
            s.shotSecondsLeft === shotSecondsLeft
              ? s
              : {
                  ...s,
                  score: res.score,
                  altitude: res.altitude,
                  coffees: res.coffees,
                  waveGap: res.waveGap,
                  rushActive,
                  shotSecondsLeft,
                }
          );
        }
      }
      // Always repaint (menu / over draw the static field too).
      engine.draw(ctx, cssW, cssH, dpr, animate);
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
      if (gameOverTimerRef.current !== null) {
        window.clearTimeout(gameOverTimerRef.current);
      }
      ro.disconnect();
      themeObserver.disconnect();
    };
  }, [handleGameOver]);

  // ---------- keyboard ----------
  useEffect(() => {
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
      const dir = hopFor(e.code, e.key);
      if (dir || e.key === " ") e.preventDefault();

      const screen = screenRef.current;
      if (screen === "menu" || screen === "over") {
        if (isStart(e.code, e.key)) start();
        return;
      }
      if (e.key === " ") {
        togglePause();
        return;
      }
      if (dir) hop(dir);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [start, hop, togglePause]);

  return {
    state,
    canvasRef,
    leftPanelRef,
    rightPanelRef,
    history,
    start,
    hop,
  };
}
