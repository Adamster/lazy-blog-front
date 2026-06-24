"use client";

import type { ReactNode } from "react";
import type { Theme } from "@/shared/providers/theme-providers";
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
  theme: Theme;
  onCycleTheme: () => void;
  lang: "en" | "ru";
  onToggleLang: () => void;
}

/**
 * Settings block — the lang + theme controls grouped under a `// settings`
 * console comment. Both keep the menu open so the user can flip them in place.
 * Order: theme → lang.
 *
 * `theme` is a single cycling control (light → dark → neo → light) — a theme is
 * mutually-exclusive by nature, so neo is just a third theme value here, not a
 * separate toggle. The indicator is accent whenever the canvas is dark
 * (dark/neo), muted on light.
 */
export function SettingsToggles({
  open,
  theme,
  onCycleTheme,
  lang,
  onToggleLang,
}: SettingsTogglesProps) {
  return (
    <div>
      <div className="px-4 pt-3 pb-1 text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
        {"// settings"}
      </div>

      {/* theme — cycles light → dark → neo → light. */}
      <CommandButton
        onClick={onCycleTheme}
        tabbable={open}
        trailing={
          <ToggleIndicator active={theme !== "light"}>
            [ {theme} ]
          </ToggleIndicator>
        }
      >
        theme
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
