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

// Auto-dismiss delay (design spec).
const TIMEOUT_MS = 4000;

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
      className="mono-toast-enter pointer-events-auto flex w-[380px] max-w-[calc(100vw-2.5rem)] cursor-pointer items-center gap-3 bg-[var(--m-card)] px-5 py-3 text-left backdrop-blur-xl"
      style={{ borderLeft: `2px solid ${STRIPE[toast.tone]}` }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="text-[11px] leading-none font-semibold tracking-[0.12em] uppercase"
          style={{ color: STRIPE[toast.tone] }}
        >
          {`// ${toast.title}`}
        </p>
        {toast.description ? (
          <p className="mt-2 text-[12px] leading-[1.6] break-words text-[var(--m-muted)]">
            {toast.description}
          </p>
        ) : null}
      </div>

      {isSuccess ? (
        <CheckIcon className="size-4 flex-none text-[var(--m-accent)]" />
      ) : (
        <ExclamationCircleIcon className="size-4 flex-none text-[var(--m-error)]" />
      )}
    </button>
  );
}

// Portals into a `.mono-portal` node so the tokens + mono font resolve (mirrors Modal).
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
      className="mono-portal pointer-events-none fixed right-5 bottom-5 z-[var(--m-z-toast)] flex flex-col items-end gap-2"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
}
