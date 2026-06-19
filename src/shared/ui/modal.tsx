"use client";

import { Modal as HeroModal, ModalContent } from "@heroui/react";
import { useId, useState, type ReactNode } from "react";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

/**
 * Brutalist-Mono modal shell. The single source of modal chrome for the app
 * (auth, confirm, …): square, 2px dim frame + 2px accent top stripe, blurred
 * backdrop. Portals into a self-created `.mono-portal` node so HeroUI overlays
 * resolve the themed `--m-*` tokens + mono font (HeroUI otherwise mounts on
 * document.body, outside the `.dark` scope).
 *
 * `width` picks one of the canonical modal widths. Children receive the HeroUI
 * `onClose` callback.
 */
export function Modal({
  isOpen,
  onOpenChange,
  onClose,
  width = "md",
  labelledBy,
  children,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  /** Fires when the modal fully closes (e.g. to reset internal view state). */
  onClose?: () => void;
  width?: "sm" | "md" | "lg";
  /** id of the heading element, wired to the dialog via `aria-labelledby`. */
  labelledBy?: string;
  children: (close: () => void) => ReactNode;
}) {
  // Portal target inside the themed `.mono-portal` scope.
  const [portal, setPortal] = useState<HTMLElement | null>(null);

  const maxWidth =
    width === "lg"
      ? "max-w-[480px]"
      : width === "sm"
        ? "max-w-[400px]"
        : "max-w-[432px]";

  return (
    <>
      <div
        ref={setPortal}
        className="mono-portal pointer-events-none fixed inset-0 z-[60]"
        aria-hidden="true"
      />

      <HeroModal
        placement="center"
        scrollBehavior="outside"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={onClose}
        radius="none"
        hideCloseButton
        disableAnimation
        portalContainer={portal ?? undefined}
        aria-labelledby={labelledBy}
        style={{ fontFamily: "var(--font-mono)" }}
        classNames={{
          // `outside` scroll = one normal scrollbar when the modal is taller
          // than the viewport (no inner modal scroll).
          wrapper: "pointer-events-auto items-center py-6",
          base: `mono-portal mono-modal-enter pointer-events-auto m-0 w-[calc(100%-2rem)] ${maxWidth} rounded-none border-2 border-[var(--m-dim)] bg-[var(--m-bg)] shadow-none`,
          backdrop:
            "mono-backdrop-enter pointer-events-auto bg-[#0a0a0a]/70 backdrop-blur-[2px]",
          header: "p-0",
          body: "p-0",
          footer: "p-0",
        }}
      >
        <ModalContent>
          {(close) => (
            <div className="border-t-2 border-t-[var(--m-accent)]">
              <div className="px-9 pt-[34px] pb-9">{children(close)}</div>
            </div>
          )}
        </ModalContent>
      </HeroModal>
    </>
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
        <div className="mono-label mb-2">{eyebrow}</div>
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
      className={`font-display flex h-9 w-full items-center justify-center bg-[var(--m-accent)] text-[14px] leading-none font-bold text-[var(--m-bg)] transition-[filter] hover:brightness-110 disabled:pointer-events-none disabled:opacity-80 ${focusRing}`}
    >
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}

/** Stable id helper for wiring a modal title to `aria-labelledby`. */
export function useModalTitleId() {
  return useId();
}
