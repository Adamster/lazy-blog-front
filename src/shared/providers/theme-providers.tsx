"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export interface ProvidersProps {
  children: React.ReactNode;
}

/** The three mutually-exclusive themes. neo extends dark (it boots `.dark` +
 *  `.neo`); a theme is exclusive by nature, so neo is a third theme, not a
 *  "mode that forces dark". */
export type Theme = "light" | "dark" | "neo";

const THEMES: readonly Theme[] = ["light", "dark", "neo"] as const;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** light → dark → neo → light. */
  cycleTheme: () => void;
  /** Derived: dark OR neo (neo extends the dark canvas). */
  isDarkTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

/** Read the theme already applied to `<html>` (the pre-paint inline script +
 *  `ThemeProvider` both set the `.dark`/`.neo` classes). SSR-safe: `"light"`
 *  when there's no document. */
function readAppliedTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const html = document.documentElement;
  return html.classList.contains("neo")
    ? "neo"
    : html.classList.contains("dark")
      ? "dark"
      : "light";
}

/**
 * Like {@link useTheme} but NEVER throws — for fallback UIs that can render
 * ABOVE or OUTSIDE the `ThemeProvider` (the root `ErrorBoundary` fallback, which
 * sits above the provider). Returns the provider value when present, else reads
 * the theme straight off `<html>` so the copy still matches the active theme.
 */
export const useThemeSafe = (): Pick<
  ThemeContextType,
  "theme" | "isDarkTheme"
> => {
  const context = useContext(ThemeContext);
  if (context) {
    return { theme: context.theme, isDarkTheme: context.isDarkTheme };
  }
  const theme = readAppliedTheme();
  return { theme, isDarkTheme: theme !== "light" };
};

/**
 * Apply the theme to `<html>` — the single source the CSS tokens key off:
 * `data-theme` (completeness) + the `.dark` / `.neo` classes. light = neither;
 * dark = `.dark`; neo = `.dark` + `.neo` (neo extends the dark tokens with the
 * rain/translucency layer). The same is done pre-paint by the inline script in
 * the root layout, so the first paint is already the right theme (no flash).
 */
function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  html.classList.toggle("dark", theme === "dark" || theme === "neo");
  html.classList.toggle("neo", theme === "neo");
}

export function ThemeProvider({ children }: ProvidersProps) {
  const [theme, setThemeState] = useState<Theme>("light");

  // The inline script already resolved + applied the theme to <html> before
  // paint; sync React state to it so consumers (the cycling control, the
  // derived `isDarkTheme`) match without driving the visual theme (which
  // <html> already carries).
  useEffect(() => {
    const html = document.documentElement;
    const applied: Theme = html.classList.contains("neo")
      ? "neo"
      : html.classList.contains("dark")
        ? "dark"
        : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(applied);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  const cycleTheme = () => {
    const idx = THEMES.indexOf(theme);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    cycleTheme,
    isDarkTheme: theme !== "light",
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className="min-h-screen">{children}</div>
    </ThemeContext.Provider>
  );
}
