"use client";

import { useState } from "react";
import { Modal, ModalHeader, useModalTitleId } from "@/shared/ui";
import { ImageCropper } from "@/shared/ui/image-cropper-dynamic";
import { useUploadAvatar } from "../model/use-upload-avatar";

interface AvatarCropModalProps {
  /** Object URL of the picked file; empty when the modal is closed. */
  src: string;
  isOpen: boolean;
  /** Close request (Esc / backdrop / Cancel). */
  onOpenChange: () => void;
  /** Owner whose avatar is being set. */
  userId: string;
  /** Fires after a successful upload (parent closes + cleans up). */
  onUploaded: () => void;
}

/**
 * Avatar crop + upload modal — the 1:1 sibling of {@link CoverCropModal}, so the
 * profile avatar is cropped in the same modal language the composer uses for the
 * cover (NOT an inline cropper that reflows the panel). Locks the stencil to 1:1
 * and owns the upload mutation INSIDE the modal. The Save button drives the
 * cropper via a bumped signal (no ref across the `ssr:false` dynamic boundary);
 * on success the parent closes.
 */
export function AvatarCropModal({
  src,
  isOpen,
  onOpenChange,
  userId,
  onUploaded,
}: AvatarCropModalProps) {
  const titleId = useModalTitleId();
  const [cropSignal, setCropSignal] = useState(0);
  const uploadAvatar = useUploadAvatar(userId);

  const onCrop = (blob: Blob) => {
    uploadAvatar.mutate(
      new File([blob], `avatar-${Date.now()}.png`, { type: "image/png" }),
      { onSuccess: () => onUploaded() }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      width="wide"
      labelledBy={titleId}
      onClose={() => setCropSignal(0)}
    >
      {(close) => (
        <>
          <ModalHeader
            eyebrow="// AVATAR"
            title="Crop to 1:1"
            titleId={titleId}
            subtitle="Drag to reposition · scroll to zoom"
            onClose={close}
          />

          <div className="max-h-[60vh] overflow-hidden border-2 border-[var(--m-dim)] bg-[var(--m-panel)]">
            <ImageCropper
              src={src}
              hideActions
              cropSignal={cropSignal}
              stencilProps={{ aspectRatio: 1, grid: true }}
              sizeRestrictions={{
                minWidth: 150,
                minHeight: 150,
                maxWidth: 4000,
                maxHeight: 4000,
              }}
              canvasWidth={150}
              canvasHeight={150}
              onCrop={onCrop}
              onCancel={close}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className={`mono-btn-outline mono-focus inline-flex h-9 items-center px-4 text-[14px] font-semibold tracking-[0.06em]`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setCropSignal((n) => n + 1)}
              disabled={uploadAvatar.isPending}
              className={`mono-cta mono-focus inline-flex h-9 items-center px-4 text-[14px] font-bold tracking-[0.06em]`}
            >
              {uploadAvatar.isPending ? "Uploading…" : "Upload"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
