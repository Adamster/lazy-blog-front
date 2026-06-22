"use client";

import { useRef, useState } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { UserResponse } from "@/shared/api/openapi";
import { Avatar } from "@/shared/ui";
import { ImageCropper } from "@/shared/ui/image-cropper-dynamic";
import { useUploadAvatar } from "../model/use-upload-avatar";
import { useDeleteAvatar } from "../model/use-delete-avatar";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

/** Diagonal film-hatch fill — the same letterbox texture as the cover dropzone. */
const FILM_BG =
  "repeating-linear-gradient(135deg,var(--m-panel) 0 1px,transparent 1px 10px)";

interface ProfileAvatarZoneProps {
  userData: UserResponse | undefined;
}

const nameOf = (u?: UserResponse) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.userName || "—";

/**
 * Step-1 LEFT panel of the edit-profile card — the avatar equivalent of
 * {@link PostCoverDropzone}. Same closed 2px box + diagonal film-hatch fill +
 * `md:h-full` stretch (the form panel sets the row height), with a 2px accent
 * top stripe echoing the card's accent edge. Holds a centered 128px avatar (its
 * own letter fallback), a `// AVATAR` label + a drag/format hint, Change / Remove
 * controls, and a `128×128px` caption. Owns the cropper + the
 * {@link useUploadAvatar} / {@link useDeleteAvatar} mutations.
 */
export function ProfileAvatarZone({ userData }: ProfileAvatarZoneProps) {
  const userId = userData?.id ?? "";
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [cropperOpen, setCropperOpen] = useState(false);

  const uploadAvatar = useUploadAvatar(userId);
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

  const onCrop = (blob: Blob) => {
    uploadAvatar.mutate(
      new File([blob], `avatar-${Date.now()}.png`, { type: "image/png" })
    );
    closeCropper();
  };

  return (
    <>
      <div
        className="flex flex-col items-center justify-center gap-6 border-2 border-t-2 border-[var(--m-dim)] border-t-[var(--m-accent)] p-10 md:h-full"
        style={{ background: FILM_BG }}
      >
        <Avatar src={userData?.avatarUrl} name={nameOf(userData)} size="lg" />

        <div className="text-center">
          <div className="mono-label text-[var(--m-muted2)]">{"// AVATAR"}</div>
          <p className="mt-4 text-[12px] leading-[1.6] text-[var(--m-muted)]">
            Drag to replace · PNG / JPG · 1:1
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`mono-btn-outline inline-flex h-9 items-center gap-2 px-4 text-[14px] leading-none font-semibold tracking-[0.06em] ${focusRing}`}
          >
            <PencilIcon className="size-3.5" />
            Change
          </button>
          {hasAvatar ? (
            <button
              type="button"
              onClick={() => deleteAvatar.mutate()}
              aria-label="Remove avatar"
              className={`mono-icon-btn size-9 text-[var(--m-error)] hover:border-[var(--m-error)] hover:text-[var(--m-error)] ${focusRing}`}
            >
              <TrashIcon className="size-3.5" />
            </button>
          ) : null}
        </div>

        <span className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
          128 × 128px
        </span>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {cropperOpen ? (
        <ImageCropper
          src={preview}
          stencilProps={{ aspectRatio: 1 }}
          sizeRestrictions={{
            minWidth: 150,
            minHeight: 150,
            maxWidth: 4000,
            maxHeight: 4000,
          }}
          canvasWidth={150}
          canvasHeight={150}
          onCrop={onCrop}
          onCancel={closeCropper}
        />
      ) : null}
    </>
  );
}
