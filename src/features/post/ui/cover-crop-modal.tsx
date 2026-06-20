"use client";

import { useState } from "react";
import { Modal, ModalHeader, useModalTitleId } from "@/shared/ui";
import { ImageCropper } from "@/shared/ui/image-cropper-dynamic";
import { useCoverUpload } from "@/features/post/model/use-cover-upload";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface CoverCropModalProps {
  /** Object URL of the picked file; empty when the modal is closed. */
  src: string;
  isOpen: boolean;
  /** Close request (Esc / backdrop / Cancel). */
  onOpenChange: () => void;
  /** Fires with the uploaded cover URL on success (parent sets it + closes). */
  onUploaded: (url: string) => void;
}

/**
 * Cover crop + upload modal. Locks the stencil to 16:9 (mirrors the read-page
 * cover) and owns the upload mutation INSIDE the modal so the page never
 * shifts while uploading. The Upload button drives the cropper via a bumped
 * signal (no ref across the `ssr:false` dynamic boundary); on success the
 * parent persists the URL and closes.
 */
export function CoverCropModal({
  src,
  isOpen,
  onOpenChange,
  onUploaded,
}: CoverCropModalProps) {
  const titleId = useModalTitleId();
  const [cropSignal, setCropSignal] = useState(0);
  const { onCrop, isUploading } = useCoverUpload(onUploaded);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      width="xl"
      labelledBy={titleId}
      onClose={() => setCropSignal(0)}
    >
      {(close) => (
        <>
          <ModalHeader
            eyebrow="// COVER IMAGE"
            title="Crop to 16:9"
            titleId={titleId}
            subtitle="Drag to reposition · scroll to zoom"
            onClose={close}
          />

          <div className="max-h-[60vh] overflow-hidden border-2 border-[var(--m-dim)] bg-[var(--m-panel)]">
            <ImageCropper
              src={src}
              hideActions
              cropSignal={cropSignal}
              stencilProps={{ aspectRatio: 16 / 9, grid: true }}
              sizeRestrictions={{
                minWidth: 1000,
                minHeight: 563,
                maxWidth: 4000,
                maxHeight: 4000,
              }}
              onCrop={onCrop}
              onCancel={close}
            />
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className={`mono-btn-outline inline-flex h-9 items-center px-4 text-[14px] font-semibold tracking-[0.06em] ${focusRing}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setCropSignal((n) => n + 1)}
              disabled={isUploading}
              className={`mono-cta inline-flex h-9 items-center px-4 text-[14px] font-bold tracking-[0.06em] ${focusRing}`}
            >
              {isUploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
