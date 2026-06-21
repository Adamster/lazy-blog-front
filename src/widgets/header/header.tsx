"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useClickOutside } from "react-haiku";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { useTheme } from "@/shared/providers/theme-providers";
import { useUser, useAuth } from "@/entities/session";
import { AuthModal } from "@/features/auth/ui/auth-modal";
import { AccountCommands } from "./account-commands";
import { LogoLockup } from "./logo-lockup";
import { PromptHeader } from "./prompt-header";
import { SettingsToggles } from "./settings-toggles";
import { useToggle } from "./use-toggle";

export function Header() {
  const { isDarkTheme, changeTheme } = useTheme();
  const { user } = useUser();
  const { isAuthenticated, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setOpen(false));

  const auth = useToggle();

  // TODO(i18n): stub — no translation layer yet, this only flips the indicator.
  // Wire it to a real i18n provider (+ persistence) when one lands.
  const [lang, setLang] = useState<"en" | "ru">("en");
  const toggleLang = () => setLang((prev) => (prev === "en" ? "ru" : "en"));

  const close = () => setOpen(false);

  return (
    <>
      {/* Fixed full-width header bar — frosted glass (translucent `--m-bg` +
          backdrop blur, no border) so the page shows through; content
          constrained to the 1240 column with the 40px page gutter. */}
      <header className="fixed inset-x-0 top-0 z-50 h-[var(--m-header-h)] bg-[var(--m-bg)]/70 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between px-10">
          <LogoLockup />

          <div className="flex items-center gap-4">
            {/* Signed-in handle → quick link to your own profile (moved out of
                the burger; the burger now holds edit_profile instead). */}
            {isAuthenticated && user?.userName && (
              <Link
                href={`/${user.userName}`}
                className="max-w-[20ch] truncate text-[12px] text-[var(--m-muted)] transition-colors hover:text-[var(--m-accent)]"
              >
                @{user.userName}
              </Link>
            )}

            {/* Morphing menu — anchored to the bar's right. The closed 36px box
              sits in the bar; on open it expands and the console drops BELOW
              the bar (`top-full`) as an absolute panel above page content. */}
            <div ref={menuRef} className="relative">
              <motion.button
                type="button"
                aria-label="Menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="flex size-9 items-center justify-center bg-[var(--m-card)] text-[var(--m-fg)] transition-colors hover:text-[var(--m-accent)]"
              >
                <Bars3Icon className="size-4" />
              </motion.button>

              {/* Console — absolute dropdown below the bar, right-aligned. Always
                rendered (so the box can size to it), animating open/closed. */}
              <motion.div
                initial={false}
                animate={{
                  opacity: open ? 1 : 0,
                  y: open ? 0 : -8,
                  pointerEvents: open ? "auto" : "none",
                }}
                transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                aria-hidden={!open}
                className="absolute top-full right-0 mt-2 w-[280px] border-2 border-[var(--m-line)] bg-[var(--m-card)]"
              >
                <PromptHeader />

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
                  isDarkTheme={isDarkTheme}
                  onToggleTheme={changeTheme}
                  lang={lang}
                  onToggleLang={toggleLang}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={auth.isOpen} onOpenChange={auth.onOpenChange} />
    </>
  );
}
