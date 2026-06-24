"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useClickOutside } from "react-haiku";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { useTheme } from "@/shared/providers/theme-providers";
import { useCrtMode } from "@/shared/lib/use-crt-mode";
import { useUser, useAuth } from "@/entities/session";
import { AuthModal } from "@/features/auth/ui/auth-modal";
import { AccountCommands } from "./account-commands";
import { HeaderLockup } from "./header-lockup";
import { PromptHeader } from "./prompt-header";
import { SettingsToggles } from "./settings-toggles";
import { useToggle } from "./use-toggle";

export function Header() {
  const { isDarkTheme, changeTheme } = useTheme();
  const { crtOn, toggleCrt } = useCrtMode();
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
          backdrop blur) so the page shows through, with a 2px `--m-card` bottom
          border separating it from the content. The lockup hugs the far LEFT
          edge and the menu burger the far RIGHT edge (a 20px edge gutter, NOT
          the 1240 content column). */}
      <header className="fixed inset-x-0 top-0 z-[var(--m-z-header)] h-[var(--m-header-h)] border-b-2 border-[var(--m-card)] bg-[var(--m-bg)]/70 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-5">
          <HeaderLockup />

          {/* Morphing menu — anchored to the bar's right. The 36px box sits in
              the bar; on open the console drops BELOW the bar (`top-full`). */}
          <div ref={menuRef} className="relative">
            <motion.button
              type="button"
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex size-9 items-center justify-center border-2 border-[var(--m-dim)] bg-[var(--m-card)] text-[var(--m-fg)] transition-colors hover:text-[var(--m-accent)]"
            >
              <Bars3Icon className="size-4" />
            </motion.button>

            {/* Console — absolute dropdown below the burger, right-aligned. Always
                rendered (so it can size), animating open/closed. */}
            <motion.div
              initial={false}
              animate={{
                opacity: open ? 1 : 0,
                y: open ? 0 : -8,
                pointerEvents: open ? "auto" : "none",
              }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              aria-hidden={!open}
              className="absolute top-full right-0 mt-2 w-[280px] border-2 border-[var(--m-dim)] bg-[var(--m-bg)]"
            >
              <PromptHeader />

              <AccountCommands
                isAuthenticated={isAuthenticated}
                userName={user?.userName}
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
                crtOn={crtOn}
                onToggleCrt={toggleCrt}
                lang={lang}
                onToggleLang={toggleLang}
              />
            </motion.div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={auth.isOpen} onOpenChange={auth.onOpenChange} />
    </>
  );
}
