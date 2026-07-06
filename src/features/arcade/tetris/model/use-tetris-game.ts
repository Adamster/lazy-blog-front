"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import {
  COLS,
  ROWS,
  NEXT_CELL_MAX,
  NEXT_CELL_SCALE,
  NEXT_COLS,
  NEXT_ROWS,
  TetrisEngine,
  type TetrisPalette,
} from "./engine";
import {
  GUEST_SCOPE,
  loadBindings,
  saveBindings,
  type BindingMap,
  createGamepadPoller,
} from "@/features/arcade/shared";
import {
  TETRIS_ACTION_IDS,
  TETRIS_DEFAULT_BINDINGS,
  TETRIS_KEYS_STORAGE,
  type TetrisAction,
} from "./bindings";
import { loadHistory, recentSeries, recordScore } from "./score-history";
import type {
  ClearEvent,
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
  eventLabel: null,
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
  const [ar, ag, ab] = parseHexRgb(accent);
  const [r, g, b] = parseHexRgb(read("--m-fg", "#dcdcdc"));
  const alpha = r + g + b < 384 ? 0.07 : 0.05; // dark fg ⇒ light theme ⇒ a touch more
  return {
    boardBg: read("--m-bg", "#181818"),
    pieceFill: accent,
    flashAccent: accent,
    ghostFill: `rgba(${ar},${ag},${ab},0.18)`,
    lockedFill: read("--m-muted2", "#7a7a7a"),
    gridLine: `rgba(${r},${g},${b},${alpha})`,
  };
}

/** How long the clear-event caption stays up. */
const EVENT_LABEL_MS = 1600;

/** Caption for a noteworthy lock outcome (plain clears stay silent). */
function clearEventLabel(e: ClearEvent): string | null {
  const noteworthy =
    e.kind === "tetris" || e.kind.startsWith("tspin") || e.b2b || e.combo >= 1;
  if (!noteworthy) return null;
  const KIND: Record<ClearEvent["kind"], string> = {
    single: "SINGLE",
    double: "DOUBLE",
    triple: "TRIPLE",
    tetris: "TETRIS",
    tspin: "T-SPIN",
    "tspin-mini": "T-SPIN MINI",
  };
  const name =
    e.kind.startsWith("tspin") && e.lines > 0
      ? `${KIND[e.kind]} ${["", "SINGLE", "DOUBLE", "TRIPLE"][e.lines]}`
      : KIND[e.kind];
  return [e.b2b ? "B2B" : null, name, e.combo >= 1 ? `COMBO ×${e.combo}` : null]
    .filter(Boolean)
    .join(" · ");
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
  historyScope = GUEST_SCOPE,
}: UseTetrisGameOptions = {}): TetrisGameApi {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<TetrisEngine | null>(null);
  const pollPadRef = useRef(createGamepadPoller());
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
  const historyScopeRef = useRef(historyScope);
  // Single score-log source the game-over handler appends to (no double-count on re-render).
  const historyRef = useRef<number[]>([]);
  // Guards handleGameOver to fire ONCE per run: `update` keeps returning dead every
  // frame once over, but `screenRef` only flips after a React commit (a frame or two
  // later), so without this the append + submit would fire on each of those frames.
  const endedRef = useRef(false);
  // Timer clearing the transient clear-event caption; re-armed on each new event.
  const eventTimerRef = useRef(0);

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
    const raf = requestAnimationFrame(() => {
      const log = loadHistory(historyScope);
      historyRef.current = log;
      setHistory(recentSeries(log));
    });
    return () => cancelAnimationFrame(raf);
  }, [historyScope]);

  const [bindings, setBindingsState] = useState<BindingMap<TetrisAction>>(
    TETRIS_DEFAULT_BINDINGS
  );
  const bindingsRef = useRef(bindings);
  useEffect(() => {
    bindingsRef.current = bindings;
  }, [bindings]);
  // Hydrate persisted bindings on mount; rAF-deferred (lint rule).
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setBindingsState(
        loadBindings(TETRIS_KEYS_STORAGE, TETRIS_DEFAULT_BINDINGS)
      )
    );
    return () => cancelAnimationFrame(raf);
  }, []);
  /** True while the CONTROLS modal owns the keyboard — game keys go inert. */
  const keysSuspendedRef = useRef(false);

  // Engine input (edges are consumed/cleared by the engine each tick).
  const inputRef = useRef<TetrisInput>({
    left: false,
    right: false,
    softDrop: false,
    rotateCW: false,
    rotateCCW: false,
    hardDrop: false,
    hold: false,
  });
  // Keyboard HELD directions — composed into inputRef each tick (gamepad ORs in).
  const kbHeldRef = useRef({ left: false, right: false, softDrop: false });
  const heldRef = useRef<Set<string>>(new Set());

  const resetInput = () => {
    const input = inputRef.current;
    input.left =
      input.right =
      input.softDrop =
      input.rotateCW =
      input.rotateCCW =
      input.hardDrop =
      input.hold =
        false;
    const kb = kbHeldRef.current;
    kb.left = kb.right = kb.softDrop = false;
    heldRef.current.clear();
  };

  const setBindings = useCallback((next: BindingMap<TetrisAction>) => {
    setBindingsState(next);
    saveBindings(TETRIS_KEYS_STORAGE, next);
    // Drop any in-flight holds — a key physically held across a remap would
    // otherwise resolve to a different/no action on keyup and stick forever.
    resetInput();
  }, []);

  const setKeysSuspended = useCallback((suspended: boolean) => {
    keysSuspendedRef.current = suspended;
    resetInput();
  }, []);

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
      eventLabel: null,
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
    const log = recordScore(historyScopeRef.current, historyRef.current, score);
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
    const holdCtx = holdCanvasRef.current?.getContext("2d") ?? null;

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

      // NEXT + HOLD cells track the WELL's at NEXT_CELL_SCALE (owner call: 1:1 read
      // too big) — both square preview canvases are sized to `NEXT_COLS·cell·scale`,
      // identically. JS-driven like the well; the CSS `size-16` is only the
      // pre-hydration fallback. (The panel is measured BEFORE this write; the
      // ResizeObserver on the canvases re-runs resize once after the change, and the
      // height-bound cell math converges immediately.)
      const nCell = Math.min(cell * NEXT_CELL_SCALE, NEXT_CELL_MAX);
      const nw = nCell * NEXT_COLS;
      const nh = nCell * NEXT_ROWS;
      for (const nc of [nextCanvasRef.current, holdCanvasRef.current]) {
        const nctx = nc?.getContext("2d");
        if (!nc || !nctx) continue;
        nc.style.width = `${nw}px`;
        nc.style.height = `${nh}px`;
        nc.width = Math.round(nw * dpr);
        nc.height = Math.round(nh * dpr);
        nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      nCssW = nw;
      nCssH = nh;
    };
    resize();

    // Repaint both preview canvases + the well with the current engine state +
    // palette. Shared so a theme change can force an immediate repaint of the
    // static menu/paused/over screens.
    const paint = () => {
      engine.drawWell(ctx, cssW, cssH, dpr);
      if (nextCtx) engine.drawNext(nextCtx, nCssW, nCssH, dpr);
      if (holdCtx) engine.drawHold(holdCtx, nCssW, nCssH, dpr);
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
    if (holdCanvasRef.current) ro.observe(holdCanvasRef.current);

    let last = performance.now();
    let lastFrame = last;
    let rafId = 0;

    const tick = (now: number) => {
      lastFrame = now;
      const dt = now - last;
      last = now;
      const animate = !prefersReducedMotion();
      const screen = screenRef.current;

      const pad = pollPadRef.current();
      if (!keysSuspendedRef.current) {
        if (screenRef.current !== "playing") {
          if (pad.anyPress) start();
        } else if (pad.pause) {
          togglePause();
        }
      }

      if (screen === "playing" && !pausedRef.current && !endedRef.current) {
        const input = inputRef.current;
        const kb = kbHeldRef.current;
        input.left = kb.left || pad.left;
        input.right = kb.right || pad.right;
        input.softDrop = kb.softDrop || pad.softDrop;
        if (pad.rotateCW) input.rotateCW = true;
        if (pad.rotateCCW) input.rotateCCW = true;
        if (pad.hardDrop) input.hardDrop = true;
        if (pad.hold) input.hold = true;
        const res = engine.update(dt, input, animate);
        if (res.dead) {
          endedRef.current = true;
          handleGameOver(res.score);
        } else {
          if (res.event) {
            const label = clearEventLabel(res.event);
            if (label) {
              window.clearTimeout(eventTimerRef.current);
              eventTimerRef.current = window.setTimeout(
                () =>
                  setState((s) =>
                    s.eventLabel === label ? { ...s, eventLabel: null } : s
                  ),
                EVENT_LABEL_MS
              );
              setState((s) => ({ ...s, eventLabel: label }));
            }
          }
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
      window.clearTimeout(eventTimerRef.current);
      ro.disconnect();
      themeObserver.disconnect();
    };
  }, [handleGameOver, start, togglePause]);

  // ---------- keyboard ----------
  useEffect(() => {
    const actionOf = (code: string): TetrisAction | null => {
      const map = bindingsRef.current;
      for (const a of TETRIS_ACTION_IDS) {
        if (map[a].includes(code)) return a;
      }
      return null;
    };

    // A held action stays on while ANY of its bound keys is physically down
    // (defaults bind two keys per direction — ← + A etc.).
    const stillHeld = (a: TetrisAction) =>
      bindingsRef.current[a].some((code) => heldRef.current.has(code));

    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }
      if (keysSuspendedRef.current) return; // CONTROLS modal owns the keyboard
      if (e.repeat) return; // native auto-repeat: holds are latched, edges are one-shot, DAS is engine-side
      const c = e.code;
      const action = actionOf(c);
      // Any bound key + Space (page scroll) get swallowed while the board is up.
      if (action || c === "Space") e.preventDefault();

      // Menu / over → start (fixed keys, independent of the bindings).
      if (screenRef.current !== "playing") {
        if (c === "Enter" || c === "Space") start();
        return;
      }
      if (action === "pause") {
        togglePause();
        return;
      }
      if (pausedRef.current) return;

      const fresh = !heldRef.current.has(c);
      heldRef.current.add(c);
      const kb = kbHeldRef.current;
      const input = inputRef.current;
      switch (action) {
        case "moveLeft":
          kb.left = true;
          break;
        case "moveRight":
          kb.right = true;
          break;
        case "softDrop":
          kb.softDrop = true;
          break;
        // One-shot edges — one per physical press (native repeat suppressed).
        case "rotateCW":
          if (fresh) input.rotateCW = true;
          break;
        case "rotateCCW":
          if (fresh) input.rotateCCW = true;
          break;
        case "hardDrop":
          if (fresh) input.hardDrop = true;
          break;
        case "hold":
          if (fresh) input.hold = true;
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldRef.current.delete(e.code);
      const action = actionOf(e.code);
      const kb = kbHeldRef.current;
      if (action === "moveLeft") kb.left = stillHeld("moveLeft");
      if (action === "moveRight") kb.right = stillHeld("moveRight");
      if (action === "softDrop") kb.softDrop = stillHeld("softDrop");
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
    holdCanvasRef,
    panelRef,
    history,
    start,
    togglePause,
    bindings,
    setBindings,
    setKeysSuspended,
  };
}
