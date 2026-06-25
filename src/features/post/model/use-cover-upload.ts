"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/api-client";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useUser } from "@/entities/session";

/**
 * Headless cover-image crop→upload mutation for the post composer. Owns only
 * the resize + upload step; the file-picker and the crop UI live in the
 * dropzone + crop modal respectively. `onCrop` takes the cropped blob, downs­
 * cales it to ≤1000px wide PNG, uploads it, and reports the URL via
 * `onUploaded`.
 */
export function useCoverUpload(onUploaded: (url: string) => void) {
  const { user } = useUser();

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      apiClient.media.uploadMedia({ id: user?.id ?? "", file }),
    onSuccess: (url) => {
      addToastSuccess("Cover uploaded. Looking good.");
      onUploaded(url);
    },
    onError: (error) => {
      addToastError("Failed to upload image", error);
    },
  });

  /** Downscale the cropped blob to ≤1000px wide PNG, then upload. */
  const onCrop = (blob: Blob) => {
    const image = new window.Image();
    image.src = URL.createObjectURL(blob);

    image.onload = () => {
      const shouldResize = image.width > 1000;
      const targetWidth = shouldResize ? 1000 : image.width;
      const targetHeight = shouldResize
        ? Math.round((image.height * targetWidth) / image.width)
        : image.height;

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas
        .getContext("2d")
        ?.drawImage(image, 0, 0, targetWidth, targetHeight);

      canvas.toBlob((finalBlob) => {
        if (!finalBlob) return;
        uploadMutation.mutate(
          new File([finalBlob], `post-${Date.now()}.png`, {
            type: "image/png",
          })
        );
      }, "image/png");
    };
  };

  return { onCrop, isUploading: uploadMutation.isPending };
}
