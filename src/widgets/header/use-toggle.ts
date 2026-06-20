"use client";

import { useCallback, useState } from "react";

/**
 * Minimal open/close state for the header's auth modal. Returns the shape the
 * header consumes (`isOpen`, `open`, `onOpenChange`). Replaces HeroUI's
 * `useDisclosure` with a trivial `useState` hook.
 */
export function useToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const onOpenChange = useCallback(() => setIsOpen((prev) => !prev), []);
  return { isOpen, open, close, onOpenChange };
}
