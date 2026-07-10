"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface CompareSliderProps {
  /** Full-bleed left pane (revealed on the left of the seam). */
  before: ReactNode;
  /** Full-bleed right pane (clipped by the seam). */
  after: ReactNode;
  /** Accessible name for the range control. */
  ariaLabel: string;
  /** Extra classes on the root (aspect ratio, size). */
  className?: string;
}

// Before/after reveal slider — two stacked panes, the right one clipped at the
// seam. Pointer drag/tap is handled on the container (a full-area native range
// mis-maps clicks: taller-than-wide ranges read as vertical sliders); a REAL
// but invisible <input type="range"> stays on top for keyboard + SR — arrows
// move the seam, `.mono-focus` draws the keyboard ring around the frame. The
// seam (2px --m-line) + 32px square grip follow the value; clip has no
// transition so the image tracks the pointer instantly (nothing to gate under
// reduced-motion — the motion is entirely user-driven).
export function CompareSlider({
  before,
  after,
  ariaLabel,
  className = "",
}: CompareSliderProps) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);

  const setFromClientX = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPos(
      Math.round(
        Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
      )
    );
  };

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          setFromClientX(e.clientX);
        }
      }}
      // images/links inside panes must not start a native HTML5 drag —
      // it would ride along with the seam drag as a ghost
      onDragStart={(e) => e.preventDefault()}
      className={`relative cursor-ew-resize touch-none overflow-hidden select-none ${className}`}
    >
      <div className="absolute inset-0">{before}</div>
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      >
        {after}
      </div>

      {/* seam */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[var(--m-dim)]"
        style={{ left: `${pos}%` }}
      />
      {/* grip — kept light: small translucent square, compact chevrons */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 z-[var(--m-z-content)] flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-[var(--m-dim)] bg-[var(--m-bg)]/80"
        style={{ left: `${pos}%` }}
      >
        <ChevronLeftIcon className="size-3 shrink-0 text-[var(--m-accent)]" />
        <ChevronRightIcon className="size-3 shrink-0 text-[var(--m-accent)]" />
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={ariaLabel}
        className="mono-focus pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-moz-range-thumb]:h-0 [&::-moz-range-thumb]:w-0 [&::-moz-range-thumb]:border-0 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none"
      />
    </div>
  );
}
