"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useIsMounted } from "@/shared/lib/use-is-mounted";
import {
  dismissToast,
  getToasts,
  subscribeToasts,
  type Toast,
} from "@/shared/lib/toasts";

const NO_TOASTS: readonly Toast[] = [];

/** Auto-dismiss after this many ms, matching HeroUI's default timeout. */
const TIMEOUT_MS = 6000;

// Mono/brutalist toast skin. The toast stack portals to <body> (outside
// `.mono-scope`, where the `--m-*` tokens don't resolve) — so the dark mono
// palette is used literally. Square, 2px frame + 2px accent left edge
// (lime = success, red = error).
const EDGE: Record<Toast["tone"], string> = {
  success: "border-l-[#cdff48]",
  error: "border-l-[#ff6b6b]",
};

function ToastIcon({ tone }: { tone: Toast["tone"] }) {
  return tone === "success" ? (
    <CheckIcon className="size-5 shrink-0 text-[#cdff48]" />
  ) : (
    <XMarkIcon className="size-5 shrink-0 text-[#ff6b6b]" />
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast.id]);

  return (
    <div
      className={`pointer-events-auto flex w-[340px] max-w-[calc(100vw-2rem)] items-start gap-3 border-2 border-l-2 border-[#2c2c2c] ${EDGE[toast.tone]} bg-[#1a1a1a] p-3 shadow-none`}
    >
      <ToastIcon tone={toast.tone} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold tracking-[0.01em] text-[#dcdcdc]">
          {toast.title}
        </p>
        <p className="mt-0.5 text-[12px] leading-[1.5] break-words text-[#9a9a9a]">
          {toast.description}
        </p>
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
        className="-mt-1 -mr-1 flex size-6 shrink-0 items-center justify-center text-[#6f6f6f] transition-colors hover:bg-[#262626] hover:text-[#dcdcdc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cdff48]"
      >
        <XMarkIcon className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Own toast renderer — subscribes to the module-level emitter in
 * `@/shared/lib/toasts` and renders a fixed, stacked portal of mono toasts in
 * an `aria-live="polite"` region (auto-dismiss + manual close). Replaces
 * HeroUI's `ToastProvider`.
 */
export function Toaster() {
  const mounted = useIsMounted();
  // Subscribe to the module-level emitter. Server snapshot is empty so SSR and
  // first paint render nothing; the portal mounts client-side.
  const toasts = useSyncExternalStore(
    subscribeToasts,
    getToasts,
    () => NO_TOASTS
  );

  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-[70] flex flex-col items-end gap-2.5"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
}
