"use client";

import type { ReactNode } from "react";
import type { Theme } from "@/shared/ui/theme";
import { CommandButton, MenuGroupLabel } from "./command-row";

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

// The lang toggle is HIDDEN until i18n is wired — re-add the row here then.
export function SettingsToggles({
  open,
  theme,
  onCycleTheme,
}: SettingsTogglesProps) {
  const dark = theme === "dark";
  return (
    <div>
      <MenuGroupLabel>{"// settings"}</MenuGroupLabel>

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
