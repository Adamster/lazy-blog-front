"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CANVAS_ROWS,
  GRID_W,
  INITIAL_LIVES,
  ShortFuseEngine,
  type ShortFusePalette,
} from "./engine";
import {
  GUEST_SCOPE,
  createGamepadPoller,
  readGamepadAxes,
  GAMEPAD_DEADZONE,
  loadBindings,
  saveBindings,
  type BindingMap,
} from "@/features/arcade/shared";
import {
  SHORT_FUSE_ACTION_IDS,
  SHORT_FUSE_DEFAULT_GAMEPAD_BINDINGS,
  SHORT_FUSE_GAMEPAD_STORAGE,
  type ShortFuseAction,
} from "./gamepad-bindings";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  HistoryPoint,
  ShortFuseGameApi,
  ShortFuseGameState,
  UseShortFuseGameOptions,
} from "./types";

/** rAF can be throttled in background tabs — this ticker keeps the sim alive. */
const FALLBACK_MS = 120;
const FALLBACK_GAP = 180;

/** Normalized held-movement direction (keyboard AND gamepad resolve to one of
 *  these before reaching {@link ShortFuseEngine.setMove}). */
type Dir = "up" | "down" | "left" | "right";

const DIR_VECTORS: Record<Dir, readonly [-1 | 0 | 1, -1 | 0 | 1]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** Physical key → normalized direction, or `null` for a non-movement key.
 *  Arrows matched on `e.key`; WASD matched on `e.code` (the PHYSICAL key) so a
 *  non-Latin layout — where `e.key` yields "ц/ф/ы/в" — doesn't silently break. */
function keyToDir(k: string, c: string): Dir | null {
  if (k === "ArrowUp" || c === "KeyW") return "up";
  if (k === "ArrowDown" || c === "KeyS") return "down";
  if (k === "ArrowLeft" || c === "KeyA") return "left";
  if (k === "ArrowRight" || c === "KeyD") return "right";
  return null;
}

/** Parse `#rgb` / `#rrggbb` → `[r,g,b]`; falls back to a light gray on anything odd. */
function parseHexRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [220, 220, 220];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Parse `#rrggbb` OR `rgb(...)` (the form {@link lerpHex} itself emits) → `[r,g,b]`. */
function parseColor(c: string): [number, number, number] {
  if (c[0] === "#") return parseHexRgb(c);
  const m = c.match(/-?\d+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0];
}

/** Blend hex/rgb colour `a` toward `b` by `t` (0 = a, 1 = b) — short-fuse's own
 *  copy of snake-classic's `lerpHex`; the short-fuse engine doesn't export one
 *  (kept local rather than reaching across feature boundaries for it). */
function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseColor(a);
  const [br, bg, bb] = parseColor(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

/**
 * Resolve the theme-native draw palette from the live `--m-*` tokens on `el`
 * (the board scope — custom props inherit, so reading the canvas works even
 * though the tokens are declared on a `.mono-scope` ancestor): boardBg ←
 * `--m-bg` · pillar ← `--m-fg` lerped 0.75 toward `--m-bg` (quiet solids —
 * read as background structure) · soft ← `--m-fg` lerped 0.45 toward
 * `--m-bg` (louder than pillar — the thing worth bombing) · player/hudText ←
 * `--m-fg` · accent ← `--m-accent` · spark/frameLine ← `--m-error` ·
 * gridLine ← `--m-fg` at a low alpha (a hair higher when fg is dark — i.e.
 * the light theme — so the dark hairline stays as subtle as the light one is
 * on dark; same trick as snake-classic) · muted ← `--m-muted`.
 */
function resolvePalette(el: Element): ShortFusePalette {
  const cs = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  const bg = read("--m-bg", "#181818");
  const fg = read("--m-fg", "#dcdcdc");
  const accent = read("--m-accent", "#cdff48");
  const error = read("--m-error", "#ff5d5d");
  const muted = read("--m-muted", "#9a9a9a");
  const [r, g, b] = parseHexRgb(fg);
  const gridAlpha = r + g + b < 384 ? 0.07 : 0.05; // dark fg ⇒ light theme ⇒ a touch more
  return {
    boardBg: bg,
    pillar: lerpHex(fg, bg, 0.75),
    soft: lerpHex(fg, bg, 0.45),
    player: fg,
    accent,
    spark: error,
    gridLine: `rgba(${r},${g},${b},${gridAlpha})`,
    frameLine: error,
    hudText: fg,
    muted,
  };
}

const INITIAL_STATE: ShortFuseGameState = {
  screen: "menu",
  paused: false,
  score: 0,
  best: 0,
  level: 1,
  lives: INITIAL_LIVES,
  isNewBest: false,
  rank: 0,
};

/**
 * The Short Fuse engine as a React hook. Owns one {@link ShortFuseEngine},
 * runs the rAF render loop (+ a `setInterval` fallback for throttled tabs),
 * wires the keyboard / resize listeners, and projects engine events onto
 * React state.
 *
 * Unlike snake-classic's edge-steered turns, movement here is HELD-direction:
 * the hook tracks the live set of pressed movement keys and, every frame,
 * pushes the most-recently-pressed still-held direction into
 * {@link ShortFuseEngine.setMove} (merged with gamepad D-pad/axis HELD state
 * when the keyboard is idle) — the engine integrates continuous motion off it.
 *
 * Data-layer split: the engine owns the LIVE run + the localStorage
 * sparkline; the board, `best` and `rank` are server-truth, fed in by the
 * arcade orchestrator (which also takes `onGameOver(score)` once per run to
 * submit).
 */
export function useShortFuseGame({
  best = 0,
  onGameOver,
  historyScope = GUEST_SCOPE,
}: UseShortFuseGameOptions = {}): ShortFuseGameApi {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Lazy getter keeps engine creation out of the render body (the compiler forbids
  // reading/writing refs during render).
  const engineRef = useRef<ShortFuseEngine | null>(null);
  const getEngine = () => {
    engineRef.current ??= new ShortFuseEngine();
    return engineRef.current;
  };

  const [state, setState] = useState<ShortFuseGameState>(INITIAL_STATE);
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

  // Push the OS reduced-motion preference straight into the engine (no React
  // state involved — nothing to rAF-defer) and keep it live across changes.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    getEngine().setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) =>
      getEngine().setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const [padBindings, setPadBindingsState] = useState<
    BindingMap<ShortFuseAction>
  >(SHORT_FUSE_DEFAULT_GAMEPAD_BINDINGS);
  const padBindingsRef = useRef(padBindings);
  useEffect(() => {
    padBindingsRef.current = padBindings;
  }, [padBindings]);
  // Hydrate persisted gamepad bindings on mount; rAF-deferred (lint rule).
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setPadBindingsState(
        loadBindings(
          SHORT_FUSE_GAMEPAD_STORAGE,
          SHORT_FUSE_DEFAULT_GAMEPAD_BINDINGS
        )
      )
    );
    return () => cancelAnimationFrame(raf);
  }, []);
  const setPadBindings = useCallback((next: BindingMap<ShortFuseAction>) => {
    setPadBindingsState(next);
    saveBindings(SHORT_FUSE_GAMEPAD_STORAGE, next);
  }, []);

  /** True while the CONTROLS modal owns input capture — game keys/gamepad go inert. */
  const keysSuspendedRef = useRef(false);
  const setKeysSuspended = useCallback((suspended: boolean) => {
    keysSuspendedRef.current = suspended;
  }, []);

  const pollPadRef = useRef<
    | (() => Partial<Record<ShortFuseAction, boolean>> & {
        anyPress: boolean;
      })
    | null
  >(null);
  const getPollPad = () => {
    pollPadRef.current ??= createGamepadPoller(
      SHORT_FUSE_ACTION_IDS,
      () => padBindingsRef.current
    );
    return pollPadRef.current;
  };
  const prevPadRef = useRef<
    Partial<Record<ShortFuseAction, boolean>> & { anyPress: boolean }
  >({ anyPress: false });

  // Live-held keyboard movement keys: `heldRef` is the membership set,
  // `dirOrderRef` the press order (most-recent-pressed LAST) — the rAF loop
  // reads the last still-held entry each frame.
  const heldRef = useRef<Set<Dir>>(new Set());
  const dirOrderRef = useRef<Dir[]>([]);

  const start = useCallback(() => {
    getEngine().reset();
    setState((s) => ({
      ...s,
      screen: "playing",
      paused: false,
      score: 0,
      level: 1,
      lives: INITIAL_LIVES,
      isNewBest: false,
      rank: 0,
    }));
  }, []);

  const togglePause = useCallback(() => {
    if (screenRef.current !== "playing") return;
    setState((s) => ({ ...s, paused: !s.paused }));
  }, []);

  const placeBomb = useCallback(() => {
    if (screenRef.current !== "playing" || pausedRef.current) return;
    getEngine().placeBomb();
  }, []);

  // Fires exactly ONCE per run: the engine reports `gameOver` on one update,
  // then `screen` flips to "over" so the sim no longer runs — the append +
  // submit happen once.
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
    let lastSim = 0;
    let lastFrame = 0;
    let rafId = 0;

    // JS-SIZED like the Tetris well (owner-caught regressions killed the CSS
    // takes: iOS can't resolve % heights against an aspect-ratio parent, and
    // the absolute/aspect variant broke desktop): measure the HOST's content
    // box, contain-fit the 15:12 grid (play grid + HUD row), write INLINE
    // px — deterministic in normal mode and fullscreen alike (in fullscreen
    // the host IS the viewport, so this also replaces the old CSS min() clamp).
    const host = canvas.parentElement;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      let availW = 760;
      let availH = (availW * CANVAS_ROWS) / GRID_W;
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
      const w = Math.min(availW, (availH * GRID_W) / CANVAS_ROWS);
      const h = (w * CANVAS_ROWS) / GRID_W;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cssW = w;
      cssH = h;
    };
    resize();

    // THEME-NATIVE palette (the Tetris/snake pattern): resolve the concrete colours from the
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
      const screen = screenRef.current;

      const held = getPollPad()();
      const axes = readGamepadAxes();
      const prevPad = prevPadRef.current;
      const pad = {
        moveUp: !!held.moveUp || axes.y < -GAMEPAD_DEADZONE,
        moveDown: !!held.moveDown || axes.y > GAMEPAD_DEADZONE,
        moveLeft: !!held.moveLeft || axes.x < -GAMEPAD_DEADZONE,
        moveRight: !!held.moveRight || axes.x > GAMEPAD_DEADZONE,
        bomb: !!held.bomb,
        start: !!held.start,
        pause: !!held.pause,
        anyPress: held.anyPress,
      };
      const edge = {
        bomb: pad.bomb && !prevPad.bomb,
        start: pad.start && !prevPad.start,
        pause: pad.pause && !prevPad.pause,
      };
      prevPadRef.current = pad;

      if (!keysSuspendedRef.current) {
        if (screen !== "playing") {
          if (edge.start) start();
        } else {
          if (edge.pause) togglePause();
          else if (edge.bomb) placeBomb();
        }
      }

      // Resolve the held movement direction: keyboard (last-pressed-still-held
      // entry) wins; gamepad D-pad/axes HELD state is the fallback when the
      // keyboard is idle. Zeroed whenever input capture is suspended, not
      // playing, or paused — the engine only ever sees real motion in-run.
      let rawDx: -1 | 0 | 1 = 0;
      let rawDy: -1 | 0 | 1 = 0;
      if (!keysSuspendedRef.current) {
        const order = dirOrderRef.current;
        const activeDir = order.length ? order[order.length - 1] : undefined;
        if (activeDir) {
          [rawDx, rawDy] = DIR_VECTORS[activeDir];
        } else {
          if (pad.moveLeft) rawDx = -1;
          else if (pad.moveRight) rawDx = 1;
          if (rawDx === 0) {
            if (pad.moveUp) rawDy = -1;
            else if (pad.moveDown) rawDy = 1;
          }
        }
      }
      const playingNow = screen === "playing" && !pausedRef.current;
      engine.setMove(playingNow ? rawDx : 0, playingNow ? rawDy : 0);

      if (playingNow) {
        const dt = Math.min(now - lastSim, 100);
        lastSim = now;
        const result = engine.update(dt);
        if (result.gameOver) {
          handleGameOver(result.score);
        } else {
          setState((s) =>
            s.score === result.score &&
            s.level === result.level &&
            s.lives === result.lives
              ? s
              : {
                  ...s,
                  score: result.score,
                  level: result.level,
                  lives: result.lives,
                }
          );
        }
        engine.drawGame(ctx, cssW, cssH, dpr);
      } else if (screen === "over" || pausedRef.current) {
        engine.drawGame(ctx, cssW, cssH, dpr);
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
  }, [handleGameOver, start, togglePause, placeBomb]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (keysSuspendedRef.current) return; // CONTROLS modal owns input capture
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
        if (!e.repeat) placeBomb(); // guard: a held Space must not autofire bombs
        return;
      }
      if (c === "KeyP") {
        togglePause();
        return;
      }

      const dir = keyToDir(k, c);
      // `heldRef` gates OS key-repeat: dirOrderRef and heldRef always stay in
      // sync, so an already-held key can only be a repeat — skip the reorder.
      if (!dir || heldRef.current.has(dir)) return;
      heldRef.current.add(dir);
      dirOrderRef.current.push(dir);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const dir = keyToDir(e.key, e.code);
      if (!dir) return;
      heldRef.current.delete(dir);
      const order = dirOrderRef.current;
      const idx = order.indexOf(dir);
      if (idx !== -1) order.splice(idx, 1);
    };

    // Stuck-key guard: alt-tabbing / focus loss mid-hold never fires keyup,
    // so clear the held state whenever the window loses focus.
    const onBlur = () => {
      heldRef.current.clear();
      dirOrderRef.current = [];
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [start, togglePause, placeBomb]);

  return {
    state,
    canvasRef,
    history,
    start,
    togglePause,
    padBindings,
    setPadBindings,
    setKeysSuspended,
  };
}
