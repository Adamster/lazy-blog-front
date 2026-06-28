"use client";

import { useCallback, useState } from "react";

export function useToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const onOpenChange = useCallback(() => setIsOpen((prev) => !prev), []);
  return { isOpen, open, close, onOpenChange };
}
