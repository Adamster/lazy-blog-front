"use client";

import Link from "next/link";
import { LogoSloth } from "@/shared/ui/logo-sloth";

/**
 * Peeking sloth — tucked off the left edge (tilted CCW); on hover it slides out
 * and rotates clockwise to upright. Links home.
 */
export function LogoLockup() {
  return (
    <Link
      href="/"
      aria-label="Home"
      className="fixed top-5 left-0 z-50 -translate-x-[72%] -rotate-[15deg] transition-all duration-300 ease-out hover:-translate-x-[12%] hover:rotate-0"
    >
      <LogoSloth className="size-10 text-[var(--m-fg)]" />
    </Link>
  );
}
