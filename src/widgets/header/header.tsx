"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useClickOutside } from "react-haiku";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { useTheme } from "@/shared/providers/theme-providers";
import { useUser } from "@/shared/providers/user-provider";
import { useAuth } from "@/features/auth/model/use-auth";
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
      <LogoLockup />

      {/* Fixed morphing menu — top right. Anchored by `right-5`, so the
          container grows leftward/downward: the burger fades out, the box
          expands, then the console items fade in. */}
      <div ref={menuRef} className="fixed top-5 right-5 z-50">
        <motion.div
          initial={false}
          animate={{ width: open ? 280 : 36, height: open ? "auto" : 36 }}
          transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          className={`relative overflow-hidden border-2 bg-[var(--m-card)] transition-colors ${
            open
              ? "border-[var(--m-line)]"
              : isAuthenticated
                ? "border-[var(--m-accent)]"
                : "border-[var(--m-dim)]"
          }`}
        >
          {/* Console list — always rendered (so the box can size to it), faded
              in only after the box has expanded. */}
          <motion.div
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.18, delay: open ? 0.2 : 0 }}
            aria-hidden={!open}
            className="w-[276px]"
          >
            <PromptHeader
              userName={user?.userName}
              open={open}
              onNavigate={close}
            />

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
              lang={lang}
              onToggleLang={toggleLang}
            />
          </motion.div>

          {/* Burger — overlay on the closed box; fades out on open. The
              closed box border goes accent when authed (logged-in cue). */}
          <motion.button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            animate={{ opacity: open ? 0 : 1 }}
            transition={{ duration: 0.12 }}
            style={{ pointerEvents: open ? "none" : "auto" }}
            className="absolute top-0 right-0 flex size-8 items-center justify-center text-[var(--m-fg)]"
          >
            <Bars3Icon className="size-4" />
          </motion.button>
        </motion.div>
      </div>

      <AuthModal isOpen={auth.isOpen} onOpenChange={auth.onOpenChange} />
    </>
  );
}
