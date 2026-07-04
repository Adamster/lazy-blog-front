"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

/**
 * Fullscreen support for an arcade board, in TWO modes behind one toggle:
 *
 * - NATIVE `requestFullscreen` on the board root where the API exists;
 * - a PSEUDO-fullscreen OVERLAY (fixed inset-0 at the modal z, page scroll
 *   locked, Esc exits) where it doesn't — iOS Safari has no element
 *   fullscreen at all, so the button used to silently do nothing on phones.
 *
 * Both modes stamp `data-board-fs` on the root (`"native"` / `"overlay"`),
 * and ALL fullscreen styling keys off that attribute — never off the
 * `:fullscreen` pseudo-class — so the two modes share one look. The game
 * hooks already ResizeObserve their host, so the canvas re-sizes itself on
 * enter/exit either way.
 */

const FS_ATTR = "data-board-fs";

type FsMode = "off" | "native" | "overlay";

export function useBoardFullscreen() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<FsMode>("off");

  // Native path: the attribute + state follow the fullscreenchange event
  // (covers Esc and system exits, not just our button).
  useEffect(() => {
    const onChange = () => {
      const el = rootRef.current;
      if (!el) return;
      const on = document.fullscreenElement === el;
      if (on) el.setAttribute(FS_ATTR, "native");
      else if (el.getAttribute(FS_ATTR) === "native")
        el.removeAttribute(FS_ATTR);
      setMode((m) => (on ? "native" : m === "native" ? "off" : m));
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Overlay path: stamp the attribute, lock the page scroll, exit on Esc.
  useEffect(() => {
    if (mode !== "overlay") return;
    const el = rootRef.current;
    if (!el) return;
    el.setAttribute(FS_ATTR, "overlay");
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMode("off");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeAttribute(FS_ATTR);
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mode]);

  const toggle = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void el.requestFullscreen();
    } else {
      // iOS Safari: no element-fullscreen API — pseudo-fullscreen instead.
      setMode((m) => (m === "overlay" ? "off" : "overlay"));
    }
  }, []);

  return { rootRef, isFullscreen: mode !== "off", toggle };
}

/** Fullscreen layout for the board ROOT: centre the stage on the viewport on
 *  the board's own bg; in OVERLAY mode the root itself becomes the viewport
 *  (fixed inset-0 at the modal layer). aspect-auto is LOAD-BEARING: iOS lets
 *  aspect-ratio beat the fixed insets, so the rabbit's 30/18 root stayed a
 *  strip instead of going fullscreen. select-none + touch-manipulation kill
 *  the double-tap text selection / zoom while playing fullscreen. */
export const FULLSCREEN_ROOT =
  "[&[data-board-fs]]:flex [&[data-board-fs]]:items-center [&[data-board-fs]]:justify-center [&[data-board-fs]]:bg-[var(--m-bg)] [&[data-board-fs]]:aspect-auto [&[data-board-fs]]:select-none [&[data-board-fs]]:touch-manipulation [&[data-board-fs=overlay]]:fixed [&[data-board-fs=overlay]]:inset-0 [&[data-board-fs=overlay]]:z-[var(--m-z-modal)]";

/** Fullscreen layout for a flex STAGE container inside the root: become the
 *  viewport (dvh — mobile URL bars lie about vh; aspect off, since keeping
 *  30/18 overflowed 16:10 screens); the height-fit canvas inside keeps its
 *  own ratio and the stage's `p-5` becomes the screen-edge inset. */
export const FULLSCREEN_STAGE =
  "[[data-board-fs]_&]:h-dvh [[data-board-fs]_&]:aspect-auto";

/**
 * The fullscreen toggle — a `mono-icon-btn` pinned to the stage's top-right.
 * Render it AFTER the overlays and ONLY on overlay screens (menu / pause —
 * owner call: never floating over live gameplay); in fullscreen the pause
 * overlay brings it back for the exit.
 */
export function BoardFullscreenButton({
  isFullscreen,
  onToggle,
}: {
  isFullscreen: boolean;
  onToggle: () => void;
}) {
  const Icon = isFullscreen ? ArrowsPointingInIcon : ArrowsPointingOutIcon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      // z-[2]: one above the overlay scrim's component-internal z-[1] (the
      // sanctioned raw-z tier — siblings within one board, see overlayBase).
      // size-9 + size-5 icon = the standard icon-button build (composer bar).
      className="mono-icon-btn mono-focus absolute top-5 right-5 z-[2] size-9"
    >
      <Icon className="size-5" />
    </button>
  );
}
