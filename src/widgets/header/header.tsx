"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useClickOutside } from "react-haiku";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { useTheme } from "@/shared/ui/theme";
import { useUser, useAuth } from "@/entities/session";
import { AuthModal } from "@/features/auth/ui/auth-modal";
import { RabbitMark } from "@/features/arcade/snake";
import { AccountCommands } from "./account-commands";
import { HeaderLockup } from "./header-lockup";
import { PromptHeader } from "./prompt-header";
import { SettingsToggles } from "./settings-toggles";
import { useToggle } from "./use-toggle";

export function Header() {
  const { theme, cycleTheme } = useTheme();
  const { user } = useUser();
  const { isAuthenticated, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setOpen(false));

  const auth = useToggle();

  // Lang toggle is hidden for now (i18n is a backlog item) — no lang state here.

  const close = () => setOpen(false);

  return (
    <>
      {/* Fixed full-width header bar — frosted glass (translucent `--m-bg` +
          backdrop blur) so the page shows through, with a 2px `--m-card` bottom
          border separating it from the content. The lockup hugs the far LEFT
          edge and the menu burger the far RIGHT edge (a 20px edge gutter, NOT
          the 1240 content column). */}
      <header className="fixed inset-x-0 top-0 z-[var(--m-z-header)] h-[var(--m-header-h)] border-b-2 border-[var(--m-card)] bg-[var(--m-bg)]/70 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-5">
          {/* Lockup + the game's white rabbit: it sits right AFTER the lockup's
              blinking cursor (a `ml-3` = 12px gap), shown when signed in — the
              link into the arcade (which is login-only, so there's no point
              dangling it to logged-out visitors). On hover/focus it
              `mono-jiggle`s (a playful "laughing" wobble; transform-only, no
              layout shift, dropped under reduced-motion). Hidden under `sm` so it
              never crowds / wraps the wordmark on a narrow phone bar. */}
          <div className="flex items-center">
            <HeaderLockup />
            {isAuthenticated && (
              <Link
                href="/arcade/follow-the-rabbit"
                aria-label="Follow the white rabbit"
                className="mono-jiggle mono-focus ml-3 hidden shrink-0 opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100 sm:inline-flex"
              >
                <RabbitMark
                  size={16}
                  fill={theme === "light" ? "var(--m-error)" : undefined}
                  className="mono-jiggle__mark"
                />
              </Link>
            )}
          </div>

          {/* Right cap — the authed `@handle` profile link sits to the LEFT of
              the burger; both ride the bar's far-right edge. The `@handle` lives
              OUTSIDE `menuRef` so it never trips the burger morph or the
              click-outside gate. */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user?.userName && (
              <Link
                href={`/${user.userName}`}
                style={{ fontFamily: "var(--font-mono)" }}
                className="mono-focus max-w-[160px] truncate text-[12px] leading-none text-[var(--m-muted)] transition-colors hover:text-[var(--m-accent)]"
              >
                @{user.userName}
              </Link>
            )}

            {/* Menu — ONE burger pinned top-right (`size-9`, `z-[1]` ABOVE the
                panel) so it reads as the `menu.sh` header's right cap; the
                full-size `w-[280px]` panel is anchored at the burger's row
                (`top-0 right-0`). OPEN, the burger drops its `bg-[var(--m-card)]`
                box (→ transparent) so only the bare `≡` icon sits in the header
                row — no mismatched box. Closed, it keeps the card box (the panel
                is invisible behind it). The panel is STATIC-sized (no
                width/height morph — animating layout every frame was janky); it
                just DROPS in with a cheap GPU-composited `opacity` +
                `translateY` (no reflow). */}
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

              {/* The single burger — always top-right, the toggle, layered ABOVE
                the panel (`z-[1]`) as the `menu.sh` header's right cap. Closed it
                reads like every other icon button: a 2px `--m-dim` border + card
                fill (hover → accent border). OPEN, both the border AND the fill
                fade to transparent (`transition-colors`), leaving just the `≡`
                icon in the header row — no box to mis-size against the row. */}
              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen((v) => !v)}
                className={`relative z-[1] flex size-9 items-center justify-center border-2 text-[var(--m-fg)] transition-colors hover:text-[var(--m-accent)] ${
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
