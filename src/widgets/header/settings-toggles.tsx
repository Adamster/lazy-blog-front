"use client";

import type { ReactNode } from "react";
import { CommandButton } from "./command-row";

/** Bracketed `[ value ]` indicator on the right of a settings toggle row. */
function ToggleIndicator({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className="ml-auto text-[11px]"
      style={{ color: active ? "var(--m-accent)" : "var(--m-muted2)" }}
    >
      {children}
    </span>
  );
}

interface SettingsTogglesProps {
  open: boolean;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  lang: "en" | "ru";
  onToggleLang: () => void;
}

/**
 * Settings block — the dark_mode + lang toggles grouped under a `// settings`
 * console comment. Both keep the menu open so the user can flip them in place.
 */
export function SettingsToggles({
  open,
  isDarkTheme,
  onToggleTheme,
  lang,
  onToggleLang,
}: SettingsTogglesProps) {
  return (
    <div className="border-t-2 border-[var(--m-dim)]">
      <div className="px-4 pt-3 pb-1 text-[11px] tracking-[0.1em] text-[var(--m-muted2)]">
        {"// settings"}
      </div>

      <CommandButton
        onClick={onToggleTheme}
        tabbable={open}
        trailing={
          <ToggleIndicator active={isDarkTheme}>
            {isDarkTheme ? "[ on ]" : "[ off ]"}
          </ToggleIndicator>
        }
      >
        dark_mode
      </CommandButton>

      {/* lang — flips the indicator (i18n wiring pending) */}
      <CommandButton
        onClick={onToggleLang}
        tabbable={open}
        trailing={<ToggleIndicator active>[ {lang} ]</ToggleIndicator>}
      >
        lang
      </CommandButton>
    </div>
  );
}
