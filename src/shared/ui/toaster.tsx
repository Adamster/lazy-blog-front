"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { useIsMounted } from "@/shared/lib/use-is-mounted";
import {
  dismissToast,
  getToasts,
  subscribeToasts,
  type Toast,
} from "@/shared/lib/toasts";

const NO_TOASTS: readonly Toast[] = [];

/** Auto-dismiss after this many ms (design spec). */
const TIMEOUT_MS = 4000;

/** Type-coloured 4px left stripe + icon colour. */
const STRIPE: Record<Toast["tone"], string> = {
  success: "var(--m-accent)",
  error: "var(--m-error)",
};

function ToastCard({ toast }: { toast: Toast }) {
  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast.id]);

  const isSuccess = toast.tone === "success";

  return (
    <button
      type="button"
      onClick={() => dismissToast(toast.id)}
      aria-label="Dismiss notification"
      className="mono-toast-enter pointer-events-auto flex w-[380px] max-w-[calc(100vw-2.5rem)] cursor-pointer items-stretch text-left"
      style={{ borderLeft: `4px solid ${STRIPE[toast.tone]}` }}
    >
      {/* Icon column — on the card surface */}
      <div className="flex w-[52px] flex-none items-center justify-center bg-[var(--m-card)]">
        {isSuccess ? (
          <CheckIcon className="size-3.5 text-[var(--m-accent)]" />
        ) : (
          <ExclamationCircleIcon className="size-3.5 text-[var(--m-error)]" />
        )}
      </div>

      {/* Content — card surface */}
      <div className="min-w-0 flex-1 bg-[var(--m-card)] px-3 py-3">
        <p className="text-[14px] leading-[1.2] font-semibold text-[var(--m-fg)]">
          {toast.title}
        </p>
        {toast.description ? (
          <p className="mt-1 text-[12px] leading-[1.5] break-words text-[var(--m-muted)]">
            {toast.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}

/**
 * Own toast renderer — subscribes to the module-level emitter in
 * `@/shared/lib/toasts` and renders a bottom-right stacked portal of two-tone
 * Brutalist-Mono toasts (4px type stripe · 52px icon col + content on
 * `--m-card`). The whole toast is the dismiss target (no close glyph); they
 * also auto-dismiss. Portals into a `.mono-portal` node so the `--m-*` tokens +
 * mono font resolve (mirrors `Modal`).
 */
export function Toaster() {
  const mounted = useIsMounted();
  const toasts = useSyncExternalStore(
    subscribeToasts,
    getToasts,
    () => NO_TOASTS
  );

  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      className="mono-portal pointer-events-none fixed right-5 bottom-5 z-[70] flex flex-col items-end gap-2"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
}
