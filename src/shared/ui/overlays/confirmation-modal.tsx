import React from "react";
import { Modal, useModalTitleId } from "./modal";
import { Button } from "../forms/button";

interface ConfirmModalProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
  eyebrow?: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
}

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
                className={`mono-label mb-6 uppercase ${
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
              className={`mono-focus -mt-1.5 -mr-2 flex size-9 shrink-0 items-center justify-center text-[20px] text-[var(--m-muted2)] transition-colors hover:bg-[var(--m-panel)] hover:text-[var(--m-fg)]`}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant={isDanger ? "danger" : "primary"}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1"
            >
              {confirmLabel}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ConfirmModal;
