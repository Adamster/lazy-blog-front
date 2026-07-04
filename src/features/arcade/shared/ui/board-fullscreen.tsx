"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

/**
 * Native-fullscreen support for an arcade board. The BOARD ROOT (not the page)
 * goes fullscreen: attach `rootRef` to the board's `relative` wrapper and give
 * it the fullscreen layout classes (see {@link FULLSCREEN_ROOT} /
 * {@link FULLSCREEN_STAGE}) so the 30/18 stage centres on the viewport. The
 * game hooks already ResizeObserve their host, so the canvas re-sizes itself
 * on enter/exit; Esc exits natively and `isFullscreen` tracks it via
 * `fullscreenchange`.
 */
export function useBoardFullscreen() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(
        rootRef.current !== null &&
          document.fullscreenElement === rootRef.current
      );
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  }, []);

  return { rootRef, isFullscreen, toggle };
}

/** Fullscreen layout for the board ROOT: centre the stage on the viewport on
 *  the board's own bg (the UA default is black). */
export const FULLSCREEN_ROOT =
  "[&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:justify-center [&:fullscreen]:bg-[var(--m-bg)]";

/** Fullscreen layout for a flex STAGE container inside the root: become the
 *  viewport (aspect off — keeping 30/18 overflowed 16:10 screens, whose
 *  viewport is NARROWER than 5:3); the height-fit canvas inside keeps its own
 *  ratio and the stage's `p-5` becomes the screen-edge inset. */
export const FULLSCREEN_STAGE =
  "[:fullscreen_&]:h-screen [:fullscreen_&]:aspect-auto";

/** Fullscreen layout for a CANVAS that itself fills the 30/18 footprint (the
 *  snakes): contain-fit the viewport with a 20px inset on the binding axis —
 *  `min()` picks whichever of width/height runs out first, so the 5/3 ratio
 *  survives 16:9, 16:10 and ultrawide alike. */
export const FULLSCREEN_CANVAS =
  "[:fullscreen_&]:h-auto [:fullscreen_&]:w-[min(calc(100vw-40px),calc((100vh-40px)*5/3))] [:fullscreen_&]:aspect-[30/18]";

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
