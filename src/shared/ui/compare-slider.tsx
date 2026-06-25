"use client";

import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

interface CompareSliderProps {
  /** Left/before panel content (e.g. the old text). */
  before: string;
  /** Right/after panel content (e.g. the new text). */
  after: string;
  /** 11px/0.12em label for the before panel. Default `BEFORE`. */
  beforeLabel?: string;
  /** 11px/0.12em label for the after panel. Default `AFTER`. */
  afterLabel?: string;
  className?: string;
}

/**
 * Before/after text slider — a bounded (never full-bleed) compare panel: drag the
 * 2px `--m-accent` handle (or arrow-key it) to wipe between two text/code panels.
 * Panels are 2px `--m-dim` boxed, labels 11px/0.12em. Defaults to a 50% split.
 * No animated snap (so reduced motion needs no special-casing — it's pointer/key
 * driven only). LAB + bounded post use.
 */
export function CompareSlider({
  before,
  after,
  beforeLabel = "BEFORE",
  afterLabel = "AFTER",
  className = "",
}: CompareSliderProps) {
  const [pct, setPct] = useState(50);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPct(Math.min(100, Math.max(0, next)));
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPct((p) => Math.max(0, p - 4));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPct((p) => Math.min(100, p + 4));
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`mono-compare ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* AFTER fills the box; BEFORE clips over it L→R by `pct`. */}
      <div className="mono-compare-panel mono-compare-after">
        <span className="mono-compare-tag">{afterLabel}</span>
        <pre className="mono-compare-text">{after}</pre>
      </div>
      <div
        className="mono-compare-panel mono-compare-before"
        style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
        aria-hidden="true"
      >
        <span className="mono-compare-tag">{beforeLabel}</span>
        <pre className="mono-compare-text">{before}</pre>
      </div>
      <div
        className="mono-compare-handle"
        style={{ left: `${pct}%` }}
        role="slider"
        tabIndex={0}
        aria-label="Reveal before / after"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        onKeyDown={onKeyDown}
      >
        <span className="mono-compare-grip" aria-hidden="true">
          ◂▸
        </span>
      </div>
    </div>
  );
}
