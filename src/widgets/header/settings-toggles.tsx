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
}

/**
 * Settings block — the theme control under a `// settings` console comment. Keeps
 * the menu open so the user can flip it in place. (The lang toggle is HIDDEN for
 * now — i18n is a backlog item; re-add the row here when wiring i18n.)
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
    </div>
  );
}
