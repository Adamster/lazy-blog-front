"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ViewMode = "grid" | "list";

interface ViewModeContextType {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  toggleView: () => void;
}

const STORAGE_KEY = "feedView";

const ViewModeContext = createContext<ViewModeContextType | undefined>(
  undefined
);

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
};

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<ViewMode>("grid");

  useEffect(() => {
    // SSR-safe init: localStorage isn't available during render, so we resolve
    // the persisted view after mount (mirrors theme-providers.tsx).
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "grid" || stored === "list") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewState(stored);
    }
  }, []);

  const setView = useCallback((v: ViewMode) => {
    setViewState(v);
    localStorage.setItem(STORAGE_KEY, v);
  }, []);

  const toggleView = useCallback(() => {
    setViewState((prev) => {
      const next = prev === "grid" ? "list" : "grid";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ViewModeContext.Provider value={{ view, setView, toggleView }}>
      {children}
    </ViewModeContext.Provider>
  );
}
