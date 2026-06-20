"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * SSR-safe "are we on the client yet" flag — `false` during server render and
 * the first client paint, `true` afterwards. Built on `useSyncExternalStore`
 * so it never calls setState inside an effect. Use to gate `createPortal`,
 * which needs a real `document`.
 */
export function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
