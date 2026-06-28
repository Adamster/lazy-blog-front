"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export interface ProvidersProps {
  children: React.ReactNode;
}

/** The two themes. */
export type Theme = "light" | "dark";

const THEMES: readonly Theme[] = ["light", "dark"] as const;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** light → dark → light. */
  cycleTheme: () => void;
  /** Derived: the dark canvas. */
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
 *  `ThemeProvider` both set the `.dark` class). SSR-safe: `"light"` when there's
 *  no document. */
function readAppliedTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Like {@link useTheme} but NEVER throws — for fallback UIs that can render
 * ABOVE or OUTSIDE the `ThemeProvider` (the root `ErrorBoundary` fallback).
 * Returns the provider value when present, else reads the theme off `<html>`.
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
  return { theme, isDarkTheme: theme === "dark" };
};

/**
 * Apply the theme to `<html>` — the single source the CSS tokens key off:
 * `data-theme` + the `.dark` class. light = neither; dark = `.dark`. The same is
 * done pre-paint by the inline script in the root layout (no flash).
 */
function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  html.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: ProvidersProps) {
  const [theme, setThemeState] = useState<Theme>("light");

  // The inline script already resolved + applied the theme to <html> before
  // paint; sync React state to it so consumers match without re-driving paint.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(readAppliedTheme());
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
    isDarkTheme: theme === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className="min-h-screen">{children}</div>
    </ThemeContext.Provider>
  );
}
