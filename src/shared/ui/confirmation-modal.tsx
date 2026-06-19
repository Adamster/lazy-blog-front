import React from "react";
import { Modal, ModalHeader, useModalTitleId } from "@/shared/ui";

interface ConfirmDeleteModalProps {
  message: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  message,
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
      labelledBy={titleId}
    >
      {(onClose) => (
        <>
          {/* The message IS the title; actions stand in for the close control. */}
          <ModalHeader eyebrow="// CONFIRM" title={message} titleId={titleId} />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="mono-btn-outline inline-flex h-9 items-center px-4 text-[14px] font-semibold tracking-[0.06em]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="inline-flex h-9 items-center border-2 border-[var(--m-error)] bg-[var(--m-error)] px-4 text-[14px] font-bold tracking-[0.06em] text-[var(--m-bg)] uppercase transition-colors hover:bg-transparent hover:text-[var(--m-error)]"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ConfirmDeleteModal;
