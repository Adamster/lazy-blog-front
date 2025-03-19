"use client";

import { ToastProvider } from "@heroui/react";
import { HeroUIProvider } from "@heroui/system";
import classNames from "classnames";
import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export interface ProvidersProps {
  children: React.ReactNode;
}

interface ThemeContextType {
  changeTheme: () => void;
  isDarkTheme: boolean;
  showPreviews: boolean;
  setShowPreviews: React.Dispatch<React.SetStateAction<boolean>>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within an ThemeProvider");
  }
  return context;
};

export function ThemeProvider({ children }: ProvidersProps) {
  const [theme, setTheme] = useState<string>("light");
  const [showPreviews, setShowPreviews] = useState(true);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.className = storedTheme;
  }, []);

  const isDarkTheme = theme === "dark";

  const changeTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  const value: ThemeContextType = {
    isDarkTheme,
    changeTheme,
    showPreviews,
    setShowPreviews,
  };

  return (
    <ThemeContext.Provider value={value}>
      <HeroUIProvider>
        <ToastProvider
          toastOffset={"top-right".includes("top") ? 60 : 0}
          placement="top-right"
          toastProps={{
            shouldShowTimeoutProgress: true,
          }}
        />

        <div
          data-theme={isDarkTheme ? "dark" : "light"}
          data-color-mode={isDarkTheme ? "dark" : "light"}
          className={classNames(
            isDarkTheme ? "dark" : "light",
            "text-foreground bg-background"
          )}
        >
          {children}
        </div>
      </HeroUIProvider>
    </ThemeContext.Provider>
  );
}
