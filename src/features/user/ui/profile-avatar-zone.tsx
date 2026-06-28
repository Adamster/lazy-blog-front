"use client";

import { useRef, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import type { UserResponse } from "@/shared/api/openapi";
import { Avatar } from "@/shared/ui";
import { displayNameOf } from "@/shared/lib/utils";
import { AvatarCropModal } from "./avatar-crop-modal";
import { useDeleteAvatar } from "../model/use-delete-avatar";

const FILM_BG =
  "repeating-linear-gradient(135deg,var(--m-panel) 0 1px,transparent 1px 10px)";

interface ProfileAvatarZoneProps {
  userData: UserResponse | undefined;
}

/** Picking a file opens the crop MODAL, never an inline cropper (would reflow the panel). */
export function ProfileAvatarZone({ userData }: ProfileAvatarZoneProps) {
  const userId = userData?.id ?? "";
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [cropperOpen, setCropperOpen] = useState(false);

  const deleteAvatar = useDeleteAvatar(userId);

  const hasAvatar = Boolean(userData?.avatarUrl);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setCropperOpen(true);
  };

  const closeCropper = () => {
    setCropperOpen(false);
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
  };

  return (
    <>
      <div
        className="flex items-center justify-center border-2 border-[var(--m-dim)] p-10 md:h-full"
        style={{ background: FILM_BG }}
      >
        <div className="group relative">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label={hasAvatar ? "Replace avatar" : "Add avatar"}
            className={`mono-focus relative block overflow-hidden`}
          >
            <Avatar
              src={userData?.avatarUrl}
              name={displayNameOf(userData, "—")}
              size="lg"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-[var(--m-bg)]/70 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <span className="text-[11px] tracking-[0.12em] text-[var(--m-fg)] uppercase">
                {hasAvatar ? "Replace" : "Add"}
              </span>
            </span>
          </button>

          {hasAvatar ? (
            <button
              type="button"
              onClick={() => deleteAvatar.mutate()}
              aria-label="Remove avatar"
              className={`mono-focus absolute -top-3 -right-3 z-[var(--m-z-content)] flex size-9 items-center justify-center border-2 border-[var(--m-dim)] bg-[var(--m-bg)] text-[var(--m-error)] opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:border-[var(--m-error)]`}
            >
              <TrashIcon className="size-3.5" />
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      <AvatarCropModal
        src={preview}
        isOpen={cropperOpen}
        onOpenChange={closeCropper}
        userId={userId}
        onUploaded={closeCropper}
      />
    </>
  );
}
