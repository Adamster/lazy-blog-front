import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { apiClient } from "@/shared/api/api-client";
import { useUser } from "@/shared/providers/user-provider";
import {
  NoSymbolIcon,
  PencilIcon,
  RocketLaunchIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, ButtonGroup, Image } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";

interface Props {
  onUploadSuccess: (url: string) => void;
  currentImage: string | undefined;
}

export const PostImageUploader = ({ onUploadSuccess, currentImage }: Props) => {
  const { user } = useUser();
  const [imagePreview, setImagePreview] = useState("");
  const [cropVisible, setCropVisible] = useState(false);
  const cropperRef = useRef<CropperRef>(null);
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

  const handleCropAndUpload = () => {
    const canvas = cropperRef.current?.getCanvas();

    canvas?.toBlob((blob) => {
      if (!blob) return;

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
    }, "image/png");
  };

  const handleRemove = () => {
    onUploadSuccess("");
    setCropVisible(false);
    setImagePreview("");
  };

  return (
    <>
      {cropVisible ? (
        <div className="flex flex-col gap-4 max-w-full">
          <Cropper
            ref={cropperRef}
            src={imagePreview}
            stencilProps={{
              aspectRatio: {
                minimum: 1 / 1,
                maximum: 16 / 9,
              },
              grid: true,
            }}
            sizeRestrictions={{
              minWidth: 800,
              minHeight: 533,
              maxWidth: 4000,
              maxHeight: 4000,
            }}
          />
          <div className="flex justify-center">
            <ButtonGroup>
              <Button
                size="sm"
                variant="solid"
                color="primary"
                onPress={handleCropAndUpload}
              >
                <RocketLaunchIcon className="h-4 w-4" />
                Upload
              </Button>
              <Button
                size="sm"
                variant="flat"
                isIconOnly
                onPress={() => {
                  setCropVisible(false);
                  setImagePreview("");
                }}
              >
                <NoSymbolIcon className="h-4 w-4" />
              </Button>
            </ButtonGroup>
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full gap-4">
          {currentImage && (
            <Image removeWrapper src={currentImage} alt="Cover image" />
          )}

          <ButtonGroup>
            <Button
              size="sm"
              variant="flat"
              onPress={() => fileInputRef.current?.click()}
            >
              <PencilIcon className="w-4 h-4" />
              Cover Image
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="danger"
              onPress={handleRemove}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </ButtonGroup>

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
