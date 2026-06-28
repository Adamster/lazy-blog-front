"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// SSR-safe client flag (false on server + first paint). `useSyncExternalStore`
// so it never setStates in an effect; gates `createPortal` (needs `document`).
export function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
