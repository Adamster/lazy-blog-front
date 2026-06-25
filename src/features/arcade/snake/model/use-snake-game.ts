"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { GRID_H, GRID_W, SnakeEngine } from "./engine";
import {
  clearBoard,
  loadBest,
  loadBoard,
  rankBoard,
  submitScore,
} from "./leaderboard";
import {
  clearHistory,
  loadHistory,
  recentSeries,
  recordScore,
} from "./score-history";
import type {
  HistoryPoint,
  RankedRow,
  ScoreRow,
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
 * The Snake Arcade engine as a React hook. Owns one {@link SnakeEngine}, runs
 * the rAF render loop (+ a `setInterval` fallback for throttled tabs), wires the
 * keyboard / resize listeners, and projects engine events (eat / die) onto
 * React state + the localStorage leaderboard. The canvas itself is imperative —
 * state only changes on discrete events, never per frame.
 *
 * Reduced motion: the red HAZARD-rabbit's size pulse freezes to a legible
 * static frame and the death EXPLOSION is skipped (the game still responds to
 * input and steps on its timer); no information is conveyed by motion alone.
 */
export function useSnakeGame({
  speed = "classic",
  // Wrap-walls ON by default: edges are pass-through, so the run ends only from
  // a self-hit or the red hazard (the page uses defaults).
  wrapWalls = true,
}: UseSnakeGameOptions = {}): SnakeGameApi {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Lazily create the engine once (a getter keeps it out of the render body —
  // the compiler forbids reading/writing refs during render).
  const engineRef = useRef<SnakeEngine | null>(null);
  const getEngine = () => {
    engineRef.current ??= new SnakeEngine(speed, wrapWalls);
    return engineRef.current;
  };

  const [state, setState] = useState<SnakeGameState>(INITIAL_STATE);
  const [board, setBoard] = useState<RankedRow[]>([]);
  // Recent-runs sparkline series (last N scores, newest on the right).
  const [history, setHistory] = useState<HistoryPoint[]>(() =>
    recentSeries([])
  );

  // Mutable mirrors so the rAF loop / key handler read fresh values without
  // re-subscribing. Synced in an effect (never written during render).
  const screenRef = useRef(state.screen);
  const pausedRef = useRef(state.paused);
  const bestRef = useRef(0);
  const rawBoardRef = useRef<ScoreRow[]>([]);
  // Raw score log (oldest → newest); the single source the game-over handler
  // appends to, so a re-render can never double-count a run.
  const historyRef = useRef<number[]>([]);
  useEffect(() => {
    screenRef.current = state.screen;
    pausedRef.current = state.paused;
  }, [state.screen, state.paused]);

  // Keep engine options live without recreating it.
  useEffect(() => {
    getEngine().setSpeed(speed);
    getEngine().setWrap(wrapWalls);
    // getEngine is a stable closure over refs; only the option values matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, wrapWalls]);

  // Hydrate best + board from localStorage on mount (client only). Deferred via
  // rAF so the setState lands in a fresh frame, not synchronously in the effect
  // (repo convention / lint rule).
  useEffect(() => {
    let raf = 0;
    raf = requestAnimationFrame(() => {
      const best = loadBest();
      const raw = loadBoard();
      const log = loadHistory();
      bestRef.current = best;
      rawBoardRef.current = raw;
      historyRef.current = log;
      setBoard(rankBoard(raw));
      setHistory(recentSeries(log));
      setState((s) => ({ ...s, best }));
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

  const resetBoard = useCallback(() => {
    const ranked = clearBoard();
    rawBoardRef.current = ranked.map((r) => ({ name: r.name, score: r.score }));
    bestRef.current = 0;
    setBoard(ranked);
    // Keep the recent-runs chart paired with the board reset.
    clearHistory();
    historyRef.current = [];
    setHistory(recentSeries([]));
    setState((s) => ({
      ...s,
      best: screenRef.current === "playing" ? s.best : 0,
    }));
  }, []);

  const handleGameOver = useCallback((score: number) => {
    const result = submitScore(rawBoardRef.current, bestRef.current, score);
    bestRef.current = result.best;
    // Log this run's score exactly once (off the ref, never a re-read).
    const log = recordScore(historyRef.current, score);
    historyRef.current = log;
    setHistory(recentSeries(log));
    // Persist the board sans YOU for next mount.
    rawBoardRef.current = result.ranked
      .filter((r) => !r.you)
      .map((r) => ({ name: r.name, score: r.score }));
    setBoard(result.ranked);
    setState((s) => ({
      ...s,
      screen: "over",
      paused: false,
      best: result.best,
      isNewBest: result.isNewBest,
      rank: result.rank,
    }));
  }, []);

  // ----- render loop + listeners -----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = getEngine();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cssW = 0;
    let cssH = 0;
    // Device-pixel ratio of the backing store — kept live by `resize` and fed to
    // the engine so the rabbit sprite rasterises on whole device pixels.
    let dpr = 1;
    let lastStep = 0;
    let lastFrame = 0;
    let rafId = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 760;
      // The element's aspect ratio is pinned to GRID_W/GRID_H, so derive the
      // height from the width — this guarantees square cells even mid-layout
      // before the element has settled its measured height.
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

  // ----- keyboard -----
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
      if (k === "ArrowUp" || k === "w" || k === "W") steer(0, -1);
      else if (k === "ArrowDown" || k === "s" || k === "S") steer(0, 1);
      else if (k === "ArrowLeft" || k === "a" || k === "A") steer(-1, 0);
      else if (k === "ArrowRight" || k === "d" || k === "D") steer(1, 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, togglePause, steer]);

  return {
    state,
    canvasRef,
    board,
    history,
    start,
    togglePause,
    steer,
    resetBoard,
  };
}
