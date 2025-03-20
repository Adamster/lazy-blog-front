import { apiClient } from "@/api/api-client";
import { UserResponse } from "@/api/apis";
import { addToastError, addToastSuccess } from "@/components/toasts/toasts";
import {
  NoSymbolIcon,
  PencilIcon,
  RocketLaunchIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, ButtonGroup, User } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { CircleStencil, Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";

interface IProps {
  userData: UserResponse | undefined;
}

export const UpdateAvatar = ({ userData }: IProps) => {
  const queryClient = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState("");
  const [cropperVisible, setCropperVisible] = useState(false);
  const cropperRef = useRef<CropperRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = userData?.id || "";

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) =>
      apiClient.users.uploadUserAvatar({ id: userId, file }),
    onSuccess: () => {
      addToastSuccess("Avatar updated!");

      queryClient.invalidateQueries({
        queryKey: ["getUserById", userId],
      });
    },
    onError: (error) => {
      addToastError("Failed to update avatar", error);
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: () => apiClient.users.deleteUserAvatar({ id: userId }),
    onSuccess: () => {
      addToastSuccess("Avatar deleted!");

      queryClient.invalidateQueries({
        queryKey: ["getUserById", userId],
      });
    },
    onError: (error) => {
      addToastError("Failed to delete avatar", error);
    },
  });

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
          <User
            avatarProps={{
              size: "lg",
              src: userData?.avatarUrl || "",
              name: `${userData?.firstName?.charAt(
                0
              )}${userData?.lastName?.charAt(0)}`,
            }}
            name={`${userData?.firstName} ${userData?.lastName}`}
            description={`@${userData?.userName}`}
          />

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
