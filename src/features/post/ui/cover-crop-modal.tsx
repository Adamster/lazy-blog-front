"use client";

import { useState } from "react";
import {
  Modal,
  ModalHeader,
  useModalTitleId,
  ImageCropper,
  Button,
} from "@/shared/ui";
import { useCoverUpload } from "@/features/post/model/use-cover-upload";

interface CoverCropModalProps {
  src: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onUploaded: (url: string) => void;
}

// Owns the upload INSIDE the modal so the page never shifts while uploading. The
// Upload button drives the cropper via a bumped signal — no ref works across the
// `ssr:false` dynamic boundary.
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

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={() => setCropSignal((n) => n + 1)}
              disabled={isUploading}
            >
              {isUploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
