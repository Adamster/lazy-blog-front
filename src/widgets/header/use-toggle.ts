"use client";

import { useDisclosure } from "@heroui/react";

/**
 * Thin wrapper over HeroUI's `useDisclosure` — the single v3 migration
 * touch-point for the header's auth-modal open/close. v3 renames this to
 * `useOverlayState`; swapping the import here keeps the header untouched.
 */
export function useToggle() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return { isOpen, open: onOpen, onOpenChange };
}
