"use client";

import type { ReactNode } from "react";
import type { Theme } from "@/shared/ui/theme";
import { CommandButton, MenuGroupLabel } from "./command-row";

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
}

/**
 * Settings block — the theme control under a `// settings` console comment. Keeps
 * the menu open so the user can flip it in place. (The lang toggle is HIDDEN for
 * now — i18n is a backlog item; re-add the row here when wiring i18n.)
 *
 * A single dark-mode toggle (light ↔ dark) — labelled `dark` with a short
 * `[ on ]` / `[ off ]` indicator (accent when on/dark, muted when off/light),
 * instead of spelling the theme name in the brackets.
 */
export function SettingsToggles({
  open,
  theme,
  onCycleTheme,
}: SettingsTogglesProps) {
  const dark = theme === "dark";
  return (
    <div>
      <MenuGroupLabel>{"// settings"}</MenuGroupLabel>

      {/* dark mode — toggles light ↔ dark. */}
      <CommandButton
        onClick={onCycleTheme}
        tabbable={open}
        trailing={
          <ToggleIndicator active={dark}>
            [ {dark ? "on" : "off"} ]
          </ToggleIndicator>
        }
      >
        dark
      </CommandButton>
    </div>
  );
}
