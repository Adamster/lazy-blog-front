import React from "react";
import { Modal, useModalTitleId } from "@/shared/ui";

interface ConfirmModalProps {
  /** 32px headline question, e.g. "Delete post?". */
  title: string;
  /** Optional 14px body explaining the consequence. */
  description?: string;
  /** Confirm button label (default "Delete"). */
  confirmLabel?: string;
  /**
   * Severity. `"danger"` (default) = destructive: error top-stripe + `// DANGER`
   * eyebrow + filled-error confirm. `"default"` = a neutral confirm (a reversible
   * action like unpublish): accent top-stripe + `// CONFIRM` eyebrow + the accent
   * `.mono-cta` confirm.
   */
  tone?: "danger" | "default";
  /** Override the eyebrow label (defaults from `tone`). */
  eyebrow?: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

/**
 * Confirm modal — Brutalist-Mono. Two tones: destructive (`danger`, the default)
 * with the error stripe + filled-error action, and a neutral `default` (accent
 * stripe + `.mono-cta`) for reversible confirms like unpublish. Eyebrow → 32px
 * title → optional 14px body, then two equal-width actions (Cancel + confirm).
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  description,
  confirmLabel = "Delete",
  tone = "danger",
  eyebrow,
  isOpen,
  onOpenChange,
  onConfirm,
}) => {
  const titleId = useModalTitleId();
  const isDanger = tone === "danger";
  const eyebrowText = eyebrow ?? (isDanger ? "// Danger" : "// Confirm");

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      width="sm"
      tone={tone}
      labelledBy={titleId}
    >
      {(onClose) => (
        <>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div
                className={`mb-6 text-[11px] font-medium tracking-[0.12em] uppercase ${
                  isDanger ? "text-[var(--m-error)]" : "text-[var(--m-accent)]"
                }`}
              >
                {eyebrowText}
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
              className={
                isDanger
                  ? `inline-flex h-9 flex-1 items-center justify-center border-2 border-[var(--m-error)] bg-[var(--m-error)] text-[14px] font-bold tracking-[0.06em] text-[var(--m-bg)] uppercase transition-colors hover:bg-transparent hover:text-[var(--m-error)] ${focusRing}`
                  : `mono-cta inline-flex h-9 flex-1 items-center justify-center text-[14px] font-bold tracking-[0.06em] ${focusRing}`
              }
            >
              {confirmLabel}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ConfirmModal;
