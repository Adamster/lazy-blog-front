"use client";

import { useState } from "react";
import {
  Modal,
  ModalHeader,
  useModalTitleId,
  ImageCropper,
  Button,
} from "@/shared/ui";
import { useUploadAvatar } from "../model/use-upload-avatar";

interface AvatarCropModalProps {
  src: string;
  isOpen: boolean;
  onOpenChange: () => void;
  userId: string;
  onUploaded: () => void;
}

/** The Upload button drives the cropper via a bumped signal — no ref across the `ssr:false` dynamic boundary. */
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
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={() => setCropSignal((n) => n + 1)}
              disabled={uploadAvatar.isPending}
            >
              {uploadAvatar.isPending ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
