"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export interface ProvidersProps {
  children: React.ReactNode;
}

interface ThemeContextType {
  changeTheme: () => void;
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

/**
 * Apply the theme to `<html>` (class `.dark` + `data-theme`) — the single
 * source the CSS tokens key off. The same is done pre-paint by the inline
 * script in the root layout, so the first paint is already the right theme
 * (no light→dark flash).
 */
function applyTheme(theme: "light" | "dark") {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  html.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: ProvidersProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // The inline script already resolved + applied the theme to <html> before
  // paint; sync React state to it so `isDarkTheme` consumers (logo, toggle)
  // match without driving the visual theme (which <html> already carries).
  useEffect(() => {
    const applied =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(applied);
  }, []);

  const isDarkTheme = theme === "dark";

  const changeTheme = () => {
    const newTheme = isDarkTheme ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const value: ThemeContextType = {
    isDarkTheme,
    changeTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className="min-h-screen">{children}</div>
    </ThemeContext.Provider>
  );
}
