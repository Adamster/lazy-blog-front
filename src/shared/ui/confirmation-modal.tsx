import React from "react";
import { Modal, useModalTitleId } from "@/shared/ui";

interface ConfirmDeleteModalProps {
  /** 32px headline question, e.g. "Delete post?". */
  title: string;
  /** Optional 14px body explaining the consequence. */
  description?: string;
  /** Destructive button label (default "Delete"). */
  confirmLabel?: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

/**
 * Destructive-confirm modal — Brutalist-Mono "DANGER" variant. Error top stripe
 * (`tone="danger"`) + `// DANGER` error eyebrow + 32px title + optional 14px
 * body, and two equal-width actions: a filled-error confirm and an outline
 * Cancel.
 */
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  title,
  description,
  confirmLabel = "Delete",
  isOpen,
  onOpenChange,
  onConfirm,
}) => {
  const titleId = useModalTitleId();

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      width="sm"
      tone="danger"
      labelledBy={titleId}
    >
      {(onClose) => (
        <>
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <div className="mb-6 text-[11px] font-medium tracking-[0.12em] text-[var(--m-error)] uppercase">
                {"// Danger"}
              </div>
              <h2
                id={titleId}
                className="font-display text-[32px] leading-none font-bold tracking-[-0.02em] text-[var(--m-fg)]"
              >
                {title}
              </h2>
              {description ? (
                <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
                  {description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`-mt-1.5 -mr-2 flex size-9 shrink-0 items-center justify-center text-[20px] text-[var(--m-muted2)] transition-colors hover:bg-[var(--m-panel)] hover:text-[var(--m-fg)] ${focusRing}`}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`mono-btn-outline inline-flex h-9 flex-1 items-center justify-center text-[14px] font-semibold tracking-[0.06em] ${focusRing}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`inline-flex h-9 flex-1 items-center justify-center border-2 border-[var(--m-error)] bg-[var(--m-error)] text-[14px] font-bold tracking-[0.06em] text-[var(--m-bg)] uppercase transition-colors hover:bg-transparent hover:text-[var(--m-error)] ${focusRing}`}
            >
              {confirmLabel}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ConfirmDeleteModal;
