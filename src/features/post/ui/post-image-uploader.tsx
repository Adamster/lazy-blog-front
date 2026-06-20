import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { apiClient } from "@/shared/api/api-client";
import { useUser } from "@/entities/session";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImageCropper } from "@/shared/ui/image-cropper-dynamic";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface Props {
  onUploadSuccess: (url: string) => void;
  currentImage: string | undefined;
}

export const PostImageUploader = ({ onUploadSuccess, currentImage }: Props) => {
  const { user } = useUser();
  const [imagePreview, setImagePreview] = useState("");
  const [cropVisible, setCropVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      apiClient.media.uploadMedia({ id: user?.id || "", file }),
    onSuccess: (url) => {
      addToastSuccess("Image uploaded successfully!");
      onUploadSuccess(url);
      setCropVisible(false);
      setImagePreview("");
    },
    onError: (error) => {
      addToastError("Failed to upload image", error);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
    setCropVisible(true);
  };

  const handleCrop = (blob: Blob) => {
    const image = new window.Image();
    const blobUrl = URL.createObjectURL(blob);
    image.src = blobUrl;

    image.onload = () => {
      const shouldResize = image.width > 1000;

      const targetWidth = shouldResize ? 1000 : image.width;
      const targetHeight = shouldResize
        ? Math.round((image.height * targetWidth) / image.width)
        : image.height;

      const resizeCanvas = document.createElement("canvas");
      resizeCanvas.width = targetWidth;
      resizeCanvas.height = targetHeight;

      const ctx = resizeCanvas.getContext("2d");
      ctx?.drawImage(image, 0, 0, targetWidth, targetHeight);

      resizeCanvas.toBlob((finalBlob) => {
        if (finalBlob) {
          const finalFile = new File([finalBlob], `post-${Date.now()}.png`, {
            type: "image/png",
          });
          uploadMutation.mutate(finalFile);
        }
      }, "image/png");
    };
  };

  const handleRemove = () => {
    onUploadSuccess("");
    setCropVisible(false);
    setImagePreview("");
  };

  return (
    <>
      {cropVisible ? (
        <ImageCropper
          src={imagePreview}
          stencilProps={{
            aspectRatio: { minimum: 3 / 2, maximum: 16 / 9 },
            grid: true,
          }}
          sizeRestrictions={{
            minWidth: 1000,
            minHeight: 500,
            maxWidth: 4000,
            maxHeight: 4000,
          }}
          saveLabel="Upload"
          onCrop={handleCrop}
          onCancel={() => {
            setCropVisible(false);
            setImagePreview("");
          }}
        />
      ) : (
        <div className="flex w-full flex-col gap-4">
          {currentImage && (
            <div className="relative aspect-[16/10] w-full overflow-hidden border-2 border-[var(--m-dim)] bg-[var(--m-panel)]">
              <Image
                src={currentImage}
                alt="Cover image"
                fill
                sizes="(max-width: 768px) 100vw, 780px"
                unoptimized
                className="object-cover"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`mono-btn-outline inline-flex h-9 items-center gap-2 px-4 text-[14px] font-semibold tracking-[0.06em] ${focusRing}`}
            >
              <PencilIcon className="size-3.5" />
              Cover Image
            </button>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove cover image"
              className={`mono-icon-btn size-9 text-[var(--m-error)] hover:border-[var(--m-error)] hover:text-[var(--m-error)] ${focusRing}`}
            >
              <TrashIcon className="size-[18px]" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </>
  );
};
