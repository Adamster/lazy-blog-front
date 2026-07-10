"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { CamGlyph } from "@/shared/ui";
import { HOME_HREF } from "@/shared/lib/routes";

// Chosen from the `/brand?tab=lab` "LOGO LOCKUP EXPERIMENTS" round: "NOT" gets
// a filled accent badge, paired with the "LAZY" wordmark and its sleepy "zzz"
// drift. Drift distances are shrunk — there isn't much room next to the nav.
const ZZZ: {
  glyph: string;
  size: number;
  dur: string;
  delay: string;
  dx: string;
  dy: string;
  rot: string;
  rot2: string;
  left: string;
  bottom: string;
}[] = [
  { glyph: "z", size: 7, dur: "1.9s", delay: "0s", dx: "3px", dy: "-4px", rot: "10deg", rot2: "26deg", left: "-2px", bottom: "1px" }, // prettier-ignore
  { glyph: "z", size: 8, dur: "2.2s", delay: "0.6s", dx: "4px", dy: "-5px", rot: "-8deg", rot2: "14deg", left: "0px", bottom: "2px" }, // prettier-ignore
  { glyph: "Z", size: 9, dur: "2.8s", delay: "1.2s", dx: "6px", dy: "-7px", rot: "6deg", rot2: "-12deg", left: "2px", bottom: "3px" }, // prettier-ignore
];

// The "LAZY" word + its sleepy zzz drift — shared by both lockup variants.
function LazyWord() {
  return (
    <span className="relative inline-block">
      <span className="font-display text-[14px] leading-none font-semibold text-[var(--m-accent)]">
        LAZY
      </span>
      <span
        className="pointer-events-none absolute top-0 right-0"
        aria-hidden="true"
      >
        {ZZZ.map((z, i) => (
          <span
            key={i}
            className="mono-zdrift font-display font-bold text-[var(--m-accent)]"
            style={
              {
                left: z.left,
                bottom: z.bottom,
                fontSize: `${z.size}px`,
                "--z-dur": z.dur,
                "--z-delay": z.delay,
                "--z-dx": z.dx,
                "--z-dy": z.dy,
                "--z-rot": z.rot,
                "--z-rot2": z.rot2,
              } as CSSProperties
            }
          >
            {z.glyph}
          </span>
        ))}
      </span>
    </span>
  );
}

// cam = the /cam identity. An invisible ghost of the blog lockup (NOT badge +
// LAZY) pins the total width, and the visible mark — a 24px accent viewfinder
// square + LAZY at the normal gap — overlays it flush left. So the icon sits
// tight to LAZY, yet the nav links after the lockup never shift on the swap.
export function HeaderLockup({ cam = false }: { cam?: boolean }) {
  return (
    <Link
      href={cam ? "/cam" : HOME_HREF}
      aria-label={cam ? "Lazy Cam — home" : "Home"}
      className="mono-focus inline-flex items-center gap-2 whitespace-nowrap"
    >
      {cam ? (
        <span className="relative inline-flex items-center">
          <span
            className="invisible inline-flex items-center gap-2"
            aria-hidden="true"
          >
            <span className="font-display px-2 py-1 text-[14px] leading-none">
              NOT
            </span>
            <span className="font-display text-[14px] leading-none font-semibold">
              LAZY
            </span>
          </span>
          <span className="absolute inset-y-0 left-0 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center bg-[var(--m-accent)]">
              <CamGlyph className="size-4 text-[var(--m-bg)]" />
            </span>
            <LazyWord />
          </span>
        </span>
      ) : (
        <>
          <span className="font-display bg-[var(--m-accent)] py-1 pr-2 pl-2 text-[14px] leading-none text-[var(--m-bg)]">
            NOT
          </span>
          <LazyWord />
        </>
      )}
    </Link>
  );
}
