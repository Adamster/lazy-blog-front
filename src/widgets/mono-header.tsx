"use client";

import Link from "next/link";
import { useRef, useState, type ComponentType, type SVGProps } from "react";
import { motion } from "framer-motion";
import { useClickOutside } from "react-haiku";
import { useDisclosure } from "@heroui/react";
import { Bars3Icon } from "@heroicons/react/24/solid";
import {
  UserIcon,
  PencilSquareIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/shared/providers/theme-providers";
import { useUser } from "@/shared/providers/user-provider";
import { useAuth } from "@/features/auth/model/use-auth";
import { AuthModal } from "@/features/auth/ui/auth-modal";
import { LogoSloth } from "@/shared/ui/logo-sloth";

// Terminal command rows: a `>` prompt + the command, hover highlights the line.
const cmdBase =
  "flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] whitespace-nowrap transition-colors hover:bg-[var(--m-panel)]";
const cmdCls = `${cmdBase} text-[var(--m-fg)] hover:text-[var(--m-accent)]`;
const cmdDanger = `${cmdBase} text-[var(--m-error)] hover:text-[var(--m-error)]`;

// Trailing `[ icon ]` on the account rows — bracketed like the toggles' `[ on ]`
// so the whole right column reads uniformly; muted2 (same color as the icon).
const BracketIcon = ({
  Icon,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}) => (
  <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-[var(--m-muted2)]">
    [<Icon className="size-3.5" />]
  </span>
);

// Accent `>` command prompt.
const Caret = () => (
  <span aria-hidden className="text-[var(--m-accent)]">
    &gt;
  </span>
);

export function MonoHeader() {
  const { isDarkTheme, changeTheme } = useTheme();
  const { user } = useUser();
  const { isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    isOpen: isAuthOpen,
    onOpen: onAuthOpen,
    onOpenChange: onAuthOpenChange,
  } = useDisclosure();

  // TODO(i18n): stub — no translation layer yet, this only flips the indicator.
  // Wire it to a real i18n provider (+ persistence) when one lands.
  const [lang, setLang] = useState<"en" | "ru">("en");
  const toggleLang = () => setLang((prev) => (prev === "en" ? "ru" : "en"));

  useClickOutside(menuRef, () => setOpen(false));

  return (
    <>
      {/* Peeking sloth — tucked off the left edge (tilted CCW); on hover it
          slides out and rotates clockwise to upright. Links home. */}
      <Link
        href="/"
        aria-label="Home"
        className="fixed top-5 left-0 z-50 -translate-x-[72%] -rotate-[15deg] transition-all duration-300 ease-out hover:-translate-x-[12%] hover:rotate-0"
      >
        <LogoSloth className="size-10 text-[var(--m-fg)]" />
      </Link>

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
            {/* Terminal prompt header */}
            <div className="flex items-center border-b-2 border-[var(--m-dim)] px-4 py-2.5 text-[12px] tracking-[0.02em]">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                aria-label="Home"
                tabIndex={open ? 0 : -1}
                className="min-w-0 truncate"
              >
                <span className="text-[var(--m-accent)]">
                  @{user?.userName ?? "guest"}
                </span>{" "}
                <span className="text-[var(--m-muted2)]">:~$</span>
              </Link>
              <span
                aria-hidden
                className="ml-1.5 shrink-0 text-[var(--m-accent)]"
                style={{ animation: "lzblink 1.1s steps(1) infinite" }}
              >
                _
              </span>
            </div>

            {/* Account */}
            {isAuthenticated ? (
              <Link
                href={`/${user?.userName ?? ""}`}
                onClick={() => setOpen(false)}
                className={cmdCls}
                tabIndex={open ? 0 : -1}
              >
                <Caret />
                profile
                <BracketIcon Icon={UserIcon} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onAuthOpen();
                  setOpen(false);
                }}
                className={cmdCls}
                tabIndex={open ? 0 : -1}
              >
                <Caret />
                login
                <BracketIcon Icon={ArrowRightEndOnRectangleIcon} />
              </button>
            )}

            {isAuthenticated && (
              <Link
                href="/create"
                onClick={() => setOpen(false)}
                className={cmdCls}
                tabIndex={open ? 0 : -1}
              >
                <Caret />
                create_post
                <BracketIcon Icon={PencilSquareIcon} />
              </Link>
            )}

            {/* logout — an account command, kept with profile/create_post */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className={cmdDanger}
                tabIndex={open ? 0 : -1}
              >
                <span aria-hidden>&gt;</span>
                logout
                <BracketIcon Icon={ArrowRightStartOnRectangleIcon} />
              </button>
            )}

            {/* Settings block — toggles grouped under a console comment */}
            <div className="border-t-2 border-[var(--m-dim)]">
              <div className="px-4 pt-3 pb-1 text-[11px] tracking-[0.1em] text-[var(--m-muted2)]">
                {"// settings"}
              </div>

              {/* dark_mode — toggles theme, keeps the menu open */}
              <button
                type="button"
                onClick={changeTheme}
                className={cmdCls}
                tabIndex={open ? 0 : -1}
              >
                <Caret />
                <span>dark_mode</span>
                <span
                  className="ml-auto text-[11px]"
                  style={{
                    color: isDarkTheme ? "var(--m-accent)" : "var(--m-muted2)",
                  }}
                >
                  {isDarkTheme ? "[ on ]" : "[ off ]"}
                </span>
              </button>

              {/* lang — flips the indicator (i18n wiring pending) */}
              <button
                type="button"
                onClick={toggleLang}
                className={cmdCls}
                tabIndex={open ? 0 : -1}
              >
                <Caret />
                <span>lang</span>
                <span className="ml-auto text-[11px] text-[var(--m-accent)]">
                  [ {lang} ]
                </span>
              </button>
            </div>
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

      <AuthModal isOpen={isAuthOpen} onOpenChange={onAuthOpenChange} />
    </>
  );
}
