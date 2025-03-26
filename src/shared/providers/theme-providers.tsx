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

export function ThemeProvider({ children }: ProvidersProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const systemPrefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches;

    const storedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;

    const finalTheme = storedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(finalTheme);
  }, []);

  const isDarkTheme = theme === "dark";

  const changeTheme = () => {
    const newTheme = isDarkTheme ? "light" : "dark";
    setTheme(newTheme);

    localStorage.setItem("theme", newTheme);
  };

  const value: ThemeContextType = {
    isDarkTheme,
    changeTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={theme} data-theme={theme} data-color-mode={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
