"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useIsMounted } from "@/shared/lib/use-is-mounted";
import { Spinner } from "./loading";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

const widthClass = {
  sm: "max-w-[400px]",
  md: "max-w-[432px]",
  lg: "max-w-[480px]",
  xl: "max-w-[760px]",
} as const;

/**
 * Brutalist-Mono modal shell. The single source of modal chrome for the app
 * (auth, confirm, …): square, 2px dim frame + 2px accent top stripe, blurred
 * backdrop. Portals into a self-created `.mono-portal` node so the themed
 * `--m-*` tokens + mono font resolve (the body-level portal otherwise mounts
 * outside the `.dark` scope).
 *
 * A hand-rolled accessible dialog: `role="dialog"` + `aria-modal`, focus moved
 * in on open, Tab/Shift+Tab trapped within, focus restored on close, Esc +
 * backdrop click close (via `onOpenChange`), and body scroll locked while open.
 *
 * `width` picks one of the canonical modal widths. Children receive an
 * `onClose` callback that triggers `onOpenChange`.
 */
export function Modal({
  isOpen,
  onOpenChange,
  onClose,
  width = "md",
  tone = "default",
  labelledBy,
  children,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  /** Fires when the modal fully closes (e.g. to reset internal view state). */
  onClose?: () => void;
  width?: "sm" | "md" | "lg" | "xl";
  /** Top-stripe colour: accent (default) or error (destructive confirms). */
  tone?: "default" | "danger";
  /** id of the heading element, wired to the dialog via `aria-labelledby`. */
  labelledBy?: string;
  children: (close: () => void) => ReactNode;
}) {
  // Portal only after mount (SSR-safe).
  const mounted = useIsMounted();
  const dialogRef = useRef<HTMLDivElement>(null);
  // Element focused before the modal opened, restored on close.
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Non-reactive bridges to the caller's (often inline) callbacks: read the
  // latest value without making the open/close effect depend on them.
  const requestClose = useEffectEvent(() => onOpenChange());
  const handleClosed = useEffectEvent(() => onClose?.());

  // Open lifecycle: scroll lock, focus move-in, focus restore + onClose fire.
  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Body scroll lock, compensating for the scrollbar width to avoid shift.
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    // Move focus into the dialog (first focusable, else the dialog itself).
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog)?.focus();

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
      handleClosed();
    };
  }, [isOpen]);

  // Esc to close + Tab focus trap.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === firstEl || !dialog.contains(active)) {
          event.preventDefault();
          lastEl.focus();
        }
      } else if (active === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="mono-portal fixed inset-0 z-[60]">
      {/* Backdrop — click closes; clicks inside the dialog don't bubble here. */}
      <div
        className="mono-backdrop-enter absolute inset-0 bg-[#0a0a0a]/70 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={() => onOpenChange()}
      />

      {/* Scroll wrapper — `outside` semantics: the page scrolls when the modal
          is taller than the viewport (no inner modal scroll). */}
      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto py-6">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          style={{ fontFamily: "var(--font-mono)" }}
          className={`mono-modal-enter m-0 w-[calc(100%-2rem)] ${widthClass[width]} border-2 border-t-2 border-[var(--m-dim)] ${
            tone === "danger"
              ? "border-t-[var(--m-error)]"
              : "border-t-[var(--m-accent)]"
          } bg-[var(--m-bg)] shadow-none outline-none`}
        >
          <div className="px-9 pt-[34px] pb-9">
            {children(() => onOpenChange())}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Canonical modal header: `// EYEBROW` (mono-label, mb-2) + 32px title + optional
 * 14px subtitle (mt-4), with a 36px close ✕ control top-right. Returns the
 * heading `id` via `titleId` so the caller can wire `aria-labelledby` on
 * {@link Modal}.
 */
export function ModalHeader({
  eyebrow,
  title,
  titleId,
  subtitle,
  onClose,
}: {
  eyebrow: string;
  title: string;
  titleId?: string;
  subtitle?: string;
  onClose?: () => void;
}) {
  return (
    <div className="mb-7 flex items-start justify-between gap-4">
      <div>
        <div className="mono-label mb-6">{eyebrow}</div>
        <h2
          id={titleId}
          className="font-display text-[32px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]"
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`-mt-1.5 -mr-2 flex size-9 shrink-0 items-center justify-center text-[20px] text-[var(--m-muted2)] transition-colors hover:bg-[var(--m-panel)] hover:text-[var(--m-fg)] ${focusRing}`}
        >
          <span aria-hidden="true">✕</span>
        </button>
      ) : null}
    </div>
  );
}

/**
 * Full-width accent submit button — the canonical auth/reset primary action.
 * 36px (`h-9`), Space Grotesk 700 / 14px, accent fill. Shows `pendingLabel`
 * while disabled-pending.
 */
export function SubmitButton({
  children,
  pending = false,
  pendingLabel,
}: {
  children: ReactNode;
  pending?: boolean;
  pendingLabel?: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`font-display flex h-9 w-full items-center justify-center gap-2 bg-[var(--m-accent)] text-[14px] leading-none font-bold tracking-[0.06em] text-[var(--m-bg)] uppercase transition-[filter] hover:brightness-110 disabled:pointer-events-none disabled:opacity-80 ${focusRing}`}
    >
      {pending ? (
        <>
          <Spinner className="text-[14px]" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Stable id helper for wiring a modal title to `aria-labelledby`. */
export function useModalTitleId() {
  return useId();
}
