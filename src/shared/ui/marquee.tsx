"use client";

import { Fragment } from "react";
import { Dot } from "./data-display/dot";

interface MarqueeProps {
  /** The phrases cycled across the band. */
  items: string[];
  className?: string;
}

/**
 * Terminal marquee ticker — an infinite horizontal band of phrases separated by
 * `Dot`s, scrolling right→left and pausing on hover. `bg-[var(--m-card)]` with a
 * 2px top+bottom rule, label scale 11px/0.12em. The track is duplicated so the
 * loop is seamless. Reduced motion: the animation is dropped (`.mono-marquee`
 * honours `prefers-reduced-motion`); the band becomes a static, horizontally
 * scrollable strip.
 */
export function Marquee({ items, className = "" }: MarqueeProps) {
  // The track is the item run rendered TWICE back-to-back so the -50% translate
  // loops seamlessly. Built inline (not a nested component) to satisfy the
  // no-component-in-render rule.
  const run = (copy: number) => (
    <span className="mono-marquee-run" aria-hidden="true">
      {items.map((item, i) => (
        <Fragment key={`${copy}-${i}`}>
          <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted)] uppercase">
            {item}
          </span>
          <Dot />
        </Fragment>
      ))}
    </span>
  );

  return (
    <div
      className={`mono-marquee border-y-2 border-[var(--m-dim)] bg-[var(--m-card)] ${className}`}
    >
      <div className="mono-marquee-track">
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}
