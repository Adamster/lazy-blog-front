"use client";

import Link from "next/link";
import { LogoSloth } from "@/shared/ui/logo-sloth";

/**
 * In-bar brand mark — the mono sloth, linking home. Mark only (no wordmark): the
 * sloth is MONO (dark on light / light on dark), never the accent tint.
 */
export function LogoLockup() {
  return (
    <Link href="/" aria-label="Home" className="group inline-flex">
      <LogoSloth className="size-9 shrink-0 text-[var(--m-fg)] transition-transform duration-200 ease-out group-hover:-rotate-6" />
    </Link>
  );
}
