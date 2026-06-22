"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * In-bar nav lockup — `home / about` rendered as muted mono links with dimmer
 * `/` separators, the active route in the accent (matching the right-side
 * `@handle` caption: 12px / mono / muted). Replaces the old `[ BLOG ] NOT LAZY`
 * wordmark; links home + secondary routes.
 */
const NAV = [
  { label: "home", href: "/" },
  { label: "about", href: "/about" },
] as const;

export function LogoLockup() {
  const pathname = usePathname();

  return (
    <nav
      style={{ fontFamily: "var(--font-mono)" }}
      className="flex items-center gap-2 text-[12px] leading-none lowercase"
    >
      {NAV.map((item, i) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <span key={item.href} className="flex items-center gap-2">
            {i > 0 && <span className="text-[var(--m-muted2)]">/</span>}
            <Link
              href={item.href}
              className={
                active
                  ? "text-[var(--m-accent)]"
                  : "text-[var(--m-muted)] transition-colors hover:text-[var(--m-accent)]"
              }
            >
              {item.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
