"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useClickOutside } from "react-haiku";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { useTheme } from "@/shared/ui/theme";
import { useUser, useAuth } from "@/entities/session";
import { AuthModal } from "@/features/auth/ui/auth-modal";
import { HOME_HREF, userHref } from "@/shared/lib/routes";
import { AccountCommands } from "./account-commands";
import { HeaderLockup } from "./header-lockup";
import { PromptHeader } from "./prompt-header";
import { SettingsToggles } from "./settings-toggles";
import { useToggle } from "./use-toggle";

const NAV_LINKS = [
  // Post/profile pages (`/u/...`) are Blog content, so they keep this active too.
  { href: HOME_HREF, label: "Blog", activePrefixes: [HOME_HREF, "/u/"] },
  { href: "/arcade", label: "Arcade", activePrefixes: ["/arcade"] },
] as const;

export function Header() {
  const { theme, cycleTheme } = useTheme();
  const { user } = useUser();
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setOpen(false));

  const auth = useToggle();

  const close = () => setOpen(false);

  // On the /cam product pages the bar stays, only the identity swaps:
  // `[ NOT ] LAZY` → `[ LAZY ] CAM`.
  const isCam = pathname?.startsWith("/cam");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[var(--m-z-header)] h-[var(--m-header-h)] border-b-2 border-[var(--m-card)] bg-[var(--m-bg)]/70 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-5">
          <div className="flex items-center">
            <HeaderLockup cam={isCam} />
            <nav className="ml-10 hidden items-center gap-4 sm:flex">
              {NAV_LINKS.map((link) => {
                const isActive = link.activePrefixes.some((prefix) =>
                  pathname?.startsWith(prefix)
                );

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    style={{ fontFamily: "var(--font-mono)" }}
                    className={`mono-focus text-[11px] leading-none font-medium tracking-[0.12em] uppercase transition-colors ${
                      isActive
                        ? "text-[var(--m-accent)]"
                        : "text-[var(--m-muted)] hover:text-[var(--m-accent)]"
                    }`}
                  >
                    <span
                      className={`transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
                    >
                      {"[ "}
                    </span>
                    {link.label}
                    <span
                      className={`transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
                    >
                      {" ]"}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* The `@handle` lives OUTSIDE `menuRef` so it doesn't trip the
              burger's click-outside gate. */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user?.userName && (
              <Link
                href={userHref(user.userName)}
                style={{ fontFamily: "var(--font-mono)" }}
                className="mono-focus max-w-[160px] truncate text-[12px] leading-none text-[var(--m-muted)] transition-colors hover:text-[var(--m-accent)]"
              >
                @{user.userName}
              </Link>
            )}

            {/* Static-sized panel (no layout morph — that was janky); it just
                fades + translates in. */}
            <div ref={menuRef} className="relative">
              <motion.div
                initial={false}
                animate={open ? "open" : "closed"}
                variants={{
                  closed: {
                    opacity: 0,
                    y: -8,
                    transition: prefersReducedMotion()
                      ? { duration: 0 }
                      : { duration: 0.13, ease: [0.4, 0, 1, 1] },
                  },
                  open: {
                    opacity: 1,
                    y: 0,
                    transition: prefersReducedMotion()
                      ? { duration: 0 }
                      : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] },
                  },
                }}
                aria-hidden={!open}
                style={{ pointerEvents: open ? "auto" : "none" }}
                className="absolute top-0 right-0 w-[280px] border-2 border-[var(--m-dim)] bg-[var(--m-bg)]"
              >
                {/* `menu.sh` bar reserves the burger's 36px footprint on its right
                  so the title never slides under the overlaid burger. */}
                <PromptHeader burgerSlot={36} />

                <AccountCommands
                  isAuthenticated={isAuthenticated}
                  open={open}
                  onNavigate={close}
                  onLogin={() => {
                    auth.open();
                    close();
                  }}
                  onLogout={() => {
                    logout();
                    close();
                  }}
                />

                <SettingsToggles
                  open={open}
                  theme={theme}
                  onCycleTheme={cycleTheme}
                />
              </motion.div>

              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen((v) => !v)}
                className={`relative flex size-9 items-center justify-center border-2 text-[var(--m-fg)] transition-colors hover:text-[var(--m-accent)] ${
                  open
                    ? "border-transparent bg-transparent"
                    : "border-[var(--m-dim)] bg-[var(--m-card)] hover:border-[var(--m-accent)]"
                }`}
              >
                <Bars3Icon className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={auth.isOpen} onOpenChange={auth.onOpenChange} />
    </>
  );
}
