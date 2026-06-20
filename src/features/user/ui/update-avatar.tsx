import { UserResponse } from "@/shared/api/openapi";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { ImageCropper } from "@/shared/ui/image-cropper-dynamic";
import { Avatar } from "@/shared/ui";
import { useUploadAvatar } from "../model/use-upload-avatar";
import { useDeleteAvatar } from "../model/use-delete-avatar";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface IProps {
  userData: UserResponse | undefined;
}

const nameOf = (u?: UserResponse) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.userName || "—";

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
          <Avatar src={userData?.avatarUrl} name={nameOf(userData)} size="lg" />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`mono-btn-outline inline-flex h-9 items-center gap-2 px-4 text-[14px] font-semibold tracking-[0.06em] ${focusRing}`}
            >
              <PencilIcon className="size-3.5" />
              Avatar
            </button>

            <button
              type="button"
              onClick={() => deleteAvatarMutation.mutate()}
              aria-label="Remove avatar"
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
            onChange={handleAvatarChange}
          />
        </div>
      )}
    </>
  );
};
