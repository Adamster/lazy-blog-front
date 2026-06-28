"use client";

import { useRef } from "react";
import Image from "next/image";
import { TrashIcon, PhotoIcon } from "@heroicons/react/24/outline";

// Film-hatch fill for the empty drop-zone + the letterbox behind a centered cover.
const FILM_BG =
  "repeating-linear-gradient(135deg,var(--m-panel) 0 1px,transparent 1px 10px)";

interface PostCoverDropzoneProps {
  coverUrl: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}

// The parent owns the crop + upload modal so cropping never changes this block's height.
export function PostCoverDropzone({
  coverUrl,
  onPick,
  onRemove,
}: PostCoverDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCover = Boolean(coverUrl);

  const openPicker = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file after a cancel.
    e.target.value = "";
    if (file) onPick(file);
  };

  return (
    <div
      className="group relative aspect-[16/9] w-full border-2 border-[var(--m-dim)] md:aspect-auto md:h-full"
      style={{ background: FILM_BG }}
    >
      <button
        type="button"
        onClick={openPicker}
        aria-label={hasCover ? "Replace cover image" : "Add cover image"}
        className={`mono-focus relative flex size-full items-center justify-center overflow-hidden`}
      >
        {hasCover ? (
          <>
            <span className="relative block aspect-[16/9] w-full">
              <Image
                src={coverUrl}
                alt="Post cover"
                fill
                sizes="(max-width: 768px) 100vw, 620px"
                unoptimized
                className="object-cover [filter:contrast(1.03)]"
              />
            </span>
            <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-focus-within:bg-[var(--m-bg)]/70 group-focus-within:opacity-100 group-hover:bg-[var(--m-bg)]/70 group-hover:opacity-100">
              <span className="text-[11px] tracking-[0.12em] text-[var(--m-fg)] uppercase">
                Replace cover
              </span>
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-4">
            <PhotoIcon
              className="size-10 text-[var(--m-muted2)]"
              aria-hidden="true"
            />
            <span className="text-center">
              <span className="mb-2 block text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
                DROP COVER IMAGE
              </span>
              <span className="block text-[11px] tracking-[0.12em] text-[var(--m-muted2)] opacity-60">
                16:9 · PNG / JPG
              </span>
            </span>
          </span>
        )}
      </button>

      {hasCover ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove cover image"
          className={`mono-icon-btn mono-focus absolute top-3 right-3 z-[var(--m-z-content)] size-9 bg-[var(--m-bg)] text-[var(--m-error)] opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:border-[var(--m-error)] hover:text-[var(--m-error)]`}
        >
          <TrashIcon className="size-3.5" />
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
