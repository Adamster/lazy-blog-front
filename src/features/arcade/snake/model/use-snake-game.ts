"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { GRID_H, GRID_W, SnakeEngine } from "./engine";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  HistoryPoint,
  SnakeGameApi,
  SnakeGameState,
  UseSnakeGameOptions,
} from "./types";

/** rAF can be throttled in background tabs — this ticker keeps the sim alive. */
const FALLBACK_MS = 120;
const FALLBACK_GAP = 180;

const INITIAL_STATE: SnakeGameState = {
  screen: "menu",
  paused: false,
  score: 0,
  best: 0,
  length: 3,
  isNewBest: false,
  rank: 0,
};

/**
 * The Snake Arcade engine as a React hook. Owns one {@link SnakeEngine}, runs the
 * rAF render loop (+ a `setInterval` fallback for throttled tabs), wires the
 * keyboard / resize listeners, and projects engine events onto React state.
 *
 * Data-layer split: the engine owns the LIVE run + the localStorage sparkline;
 * the board, `best` and `rank` are server-truth, fed in by `useSnakeArcade` (which
 * also takes `onGameOver(score)` once per run to submit).
 */
export function useSnakeGame({
  speed = "classic",
  wrapWalls = true,
  best = 0,
  onGameOver,
}: UseSnakeGameOptions = {}): SnakeGameApi {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Lazy getter keeps engine creation out of the render body (the compiler forbids
  // reading/writing refs during render).
  const engineRef = useRef<SnakeEngine | null>(null);
  const getEngine = () => {
    engineRef.current ??= new SnakeEngine(speed, wrapWalls);
    return engineRef.current;
  };

  const [state, setState] = useState<SnakeGameState>(INITIAL_STATE);
  const [history, setHistory] = useState<HistoryPoint[]>(() =>
    recentSeries([])
  );

  // Mutable mirrors so the rAF loop / key handler / game-over read fresh values
  // without re-subscribing (synced in effects, never written during render).
  const screenRef = useRef(state.screen);
  const pausedRef = useRef(state.paused);
  const bestRef = useRef(best);
  const onGameOverRef = useRef(onGameOver);
  // The single score-log source the game-over handler appends to, so a re-render can't double-count.
  const historyRef = useRef<number[]>([]);
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

  // Keep engine options live without recreating it.
  useEffect(() => {
    getEngine().setSpeed(speed);
    getEngine().setWrap(wrapWalls);
    // getEngine is a stable closure over refs; only the option values matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, wrapWalls]);

  // Hydrate the log from localStorage on mount; deferred via rAF (repo lint rule).
  useEffect(() => {
    let raf = 0;
    raf = requestAnimationFrame(() => {
      const log = loadHistory();
      historyRef.current = log;
      setHistory(recentSeries(log));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

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
      length: 3,
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
    const log = recordScore(historyRef.current, score);
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
    // Kept live by `resize`; fed to the engine so sprites rasterise on whole device pixels.
    let dpr = 1;
    let lastStep = 0;
    let lastFrame = 0;
    let rafId = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 760;
      // Aspect is pinned to GRID_W/GRID_H, so derive height from width — square cells
      // even mid-layout, before the element has settled its measured height.
      const h = canvas.clientHeight || Math.round((w * GRID_H) / GRID_W);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cssW = w;
      cssH = h;
    };
    resize();

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

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
          const result = engine.step(animate);
          if (result.dead) {
            handleGameOver(result.score);
          } else {
            setState((s) =>
              s.score === result.score && s.length === result.length
                ? s
                : { ...s, score: result.score, length: result.length }
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
