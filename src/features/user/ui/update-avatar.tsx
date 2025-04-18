import { UserResponse } from "@/shared/api/openapi";
import {
  NoSymbolIcon,
  PencilIcon,
  RocketLaunchIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, ButtonGroup } from "@heroui/react";
import { useRef, useState } from "react";
import { CircleStencil, Cropper, CropperRef } from "react-advanced-cropper";
import { useUploadAvatar } from "../model/use-upload-avatar";
import { useDeleteAvatar } from "../model/use-delete-avatar";

import "react-advanced-cropper/dist/style.css";
import { UserAvatar } from "./user-avatar";

interface IProps {
  userData: UserResponse | undefined;
}

export const UpdateAvatar = ({ userData }: IProps) => {
  const [avatarPreview, setAvatarPreview] = useState("");
  const [cropperVisible, setCropperVisible] = useState(false);
  const cropperRef = useRef<CropperRef>(null);
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

  const handleCropAndUpload = () => {
    const canvas = cropperRef.current?.getCanvas({ width: 150, height: 150 });

    canvas?.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], `avatar-${Date.now()}.png`, {
          type: "image/png",
        });

        uploadAvatarMutation.mutate(croppedFile);
        setCropperVisible(false);
      }
    });
  };

  const handleCropClose = () => {
    setCropperVisible(false);
    setAvatarPreview("");
  };

  return (
    <>
      {cropperVisible ? (
        <div className="flex flex-col gap-4 max-w-full">
          <Cropper
            ref={cropperRef}
            src={avatarPreview}
            stencilComponent={CircleStencil}
            stencilProps={{ aspectRatio: 1 }}
            sizeRestrictions={{
              minWidth: 150,
              minHeight: 150,
              maxWidth: 4000,
              maxHeight: 4000,
            }}
          />
          <div className="flex justify-end">
            <ButtonGroup>
              <Button
                color="primary"
                size="sm"
                variant="solid"
                onPress={handleCropAndUpload}
              >
                <RocketLaunchIcon className="h-4 w-4" />
                Save
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={handleCropClose}
              >
                <NoSymbolIcon className="h-4 w-4" />
              </Button>
            </ButtonGroup>
          </div>
        </div>
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
                <PencilIcon className="w-4 h-4" />
                Avatar
              </Button>

              <Button
                isIconOnly
                size="sm"
                variant="flat"
                color="danger"
                onPress={() => deleteAvatarMutation.mutate()}
              >
                <TrashIcon className="w-4 h-4" />
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
