"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * CRT / scanline "monitor mode" — ONE source of truth, shared by the /brand LAB
 * panel and the header settings toggle. The truth is the `crt` class on
 * `<html>` (the CSS overlay is gated by it, so the layout inline script can set
 * it pre-paint with NO hydration mismatch) + `localStorage('crt')`. A tiny
 * module-level subscribe/emit store (mirroring `@/shared/lib/toasts`) keeps
 * every `useCrtMode` consumer in lockstep, so toggling in the header updates the
 * /brand panel's indicator and vice-versa — no drift between the two surfaces.
 *
 * The visual is rendered once by {@link CrtOverlay}, always mounted near the
 * `<Toaster/>`; this hook only flips the class + storage and notifies listeners.
 */
const listeners = new Set<() => void>();

const isCrtOn = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("crt");

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const setCrt = (next: boolean) => {
  document.documentElement.classList.toggle("crt", next);
  try {
    localStorage.setItem("crt", next ? "on" : "off");
  } catch {
    // storage unavailable (private mode / quota) — class still applies
  }
  listeners.forEach((listener) => listener());
};

export function useCrtMode(): { crtOn: boolean; toggleCrt: () => void } {
  // Server snapshot is `false` — `html.crt` is applied client-side by the
  // pre-paint inline script, so SSR markup matches an off state and the class
  // (not React) drives the actual overlay (no hydration mismatch).
  const crtOn = useSyncExternalStore(subscribe, isCrtOn, () => false);
  const toggleCrt = useCallback(() => setCrt(!isCrtOn()), []);
  return { crtOn, toggleCrt };
}
