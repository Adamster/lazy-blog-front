import { useRef, useState } from "react";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/api-client";
import { Button, ButtonGroup } from "@heroui/react";
import {
  RocketLaunchIcon,
  NoSymbolIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { addToastError, addToastSuccess } from "@/utils/toasts";
import { useAuth } from "@/providers/auth-provider";

interface Props {
  onUploadSuccess: (url: string) => void;
}

export const PostImageUploader = ({ onUploadSuccess }: Props) => {
  const { user } = useAuth();
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

    setImagePreview(URL.createObjectURL(file));
    setCropVisible(true);
  };

  const handleCropAndUpload = () => {
    const canvas = cropperRef.current?.getCanvas({ width: 600, height: 400 });

    canvas?.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], `post-${Date.now()}.png`, {
          type: "image/png",
        });
        uploadMutation.mutate(croppedFile);
      }
    });
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
            stencilProps={{ aspectRatio: 3 / 2, minWidth: 600, minHeight: 400 }}
          />
          <div className="flex justify-end">
            <ButtonGroup>
              <Button
                variant="solid"
                color="primary"
                onPress={handleCropAndUpload}
              >
                <RocketLaunchIcon className="h-4 w-4" />
                Upload
              </Button>
              <Button
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
        <>
          <ButtonGroup>
            <Button
              size="sm"
              variant="flat"
              onPress={() => fileInputRef.current?.click()}
            >
              <PencilIcon className="w-4 h-4" />
              Image
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
        </>
      )}
    </>
  );
};
