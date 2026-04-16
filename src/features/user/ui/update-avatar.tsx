import { UserResponse } from "@/shared/api/openapi";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, ButtonGroup } from "@heroui/react";
import { useRef, useState } from "react";
import { ImageCropper } from "@/shared/ui/image-cropper-dynamic";
import { useUploadAvatar } from "../model/use-upload-avatar";
import { useDeleteAvatar } from "../model/use-delete-avatar";

import { UserAvatar } from "./user-avatar";

interface IProps {
  userData: UserResponse | undefined;
}

export const UpdateAvatar = ({ userData }: IProps) => {
  const [avatarPreview, setAvatarPreview] = useState("");
  const [cropperVisible, setCropperVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = userData?.id || "";

  const uploadAvatarMutation = useUploadAvatar(userId);
  const deleteAvatarMutation = useDeleteAvatar(userId);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    setCropperVisible(true);
  };

  const handleCrop = (blob: Blob) => {
    const croppedFile = new File([blob], `avatar-${Date.now()}.png`, {
      type: "image/png",
    });
    uploadAvatarMutation.mutate(croppedFile);
    setCropperVisible(false);
  };

  const handleCropClose = () => {
    setCropperVisible(false);
    setAvatarPreview("");
  };

  return (
    <>
      {cropperVisible ? (
        <ImageCropper
          src={avatarPreview}
          stencilShape="circle"
          stencilProps={{ aspectRatio: 1 }}
          sizeRestrictions={{
            minWidth: 150,
            minHeight: 150,
            maxWidth: 4000,
            maxHeight: 4000,
          }}
          canvasWidth={150}
          canvasHeight={150}
          onCrop={handleCrop}
          onCancel={handleCropClose}
        />
      ) : (
        <div className="flex flex-col items-start gap-4">
          <UserAvatar user={userData} isProfile />

          <div className="flex flex-wrap gap-4">
            <ButtonGroup>
              <Button
                size="sm"
                variant="flat"
                onPress={() => fileInputRef.current?.click()}
              >
                <PencilIcon className="h-4 w-4" />
                Avatar
              </Button>

              <Button
                isIconOnly
                size="sm"
                variant="flat"
                color="danger"
                onPress={() => deleteAvatarMutation.mutate()}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </ButtonGroup>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      )}
    </>
  );
};
