"use client";

import { useRef } from "react";
import Image from "next/image";
import { TrashIcon } from "@heroicons/react/24/outline";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface PostCoverDropzoneProps {
  /** Current cover URL (empty string when unset). */
  coverUrl: string;
  /** A file was picked → parent opens the crop modal with it. */
  onPick: (file: File) => void;
  /** Clear the cover (no modal). */
  onRemove: () => void;
}

/** Empty-state cloud-upload glyph. */
function UploadGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      aria-hidden="true"
      className="size-10 text-[var(--m-muted2)]"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
      />
    </svg>
  );
}

/**
 * Step-1 cover slot, full-column 16:9. Empty = the design's "film frame"
 * drop-zone (diagonal hatch + accent markers + upload prompt). Filled = the
 * image with a hover "replace" overlay + a remove control. Clicking opens the
 * OS file picker and emits the chosen `File` up; the parent owns the crop +
 * upload modal (so cropping never blows up this block's height).
 */
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
    <div className="group relative aspect-[16/9] w-full border-2 border-[var(--m-dim)]">
      <button
        type="button"
        onClick={openPicker}
        aria-label={hasCover ? "Replace cover image" : "Add cover image"}
        className={`relative flex size-full flex-col items-center justify-center gap-3.5 overflow-hidden ${focusRing}`}
        style={
          hasCover
            ? undefined
            : {
                background:
                  "repeating-linear-gradient(135deg,var(--m-panel) 0 1px,transparent 1px 10px)",
              }
        }
      >
        {/* Film frame markers */}
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-3 w-0.5 bg-[var(--m-accent)] opacity-50"
        />
        <span
          aria-hidden="true"
          className="absolute top-0 right-3 bottom-0 w-0.5 bg-[var(--m-accent)] opacity-50"
        />

        {hasCover ? (
          <>
            <Image
              src={coverUrl}
              alt="Post cover"
              fill
              sizes="(max-width: 768px) 100vw, 780px"
              unoptimized
              className="object-cover [filter:contrast(1.03)]"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-[var(--m-bg)]/0 opacity-0 transition-opacity group-focus-within:bg-[var(--m-bg)]/70 group-focus-within:opacity-100 group-hover:bg-[var(--m-bg)]/70 group-hover:opacity-100">
              <span className="text-[11px] tracking-[0.12em] text-[var(--m-fg)] uppercase">
                Replace cover
              </span>
            </span>
          </>
        ) : (
          <>
            <UploadGlyph />
            <span className="text-center">
              <span className="mb-2 block text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
                DROP COVER IMAGE
              </span>
              <span className="block text-[11px] tracking-[0.12em] text-[var(--m-muted2)] opacity-60">
                16:9 · PNG / JPG
              </span>
            </span>
          </>
        )}
      </button>

      {hasCover ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove cover image"
          className={`absolute top-3 right-3 z-10 flex size-9 items-center justify-center border-2 border-[var(--m-dim)] bg-[var(--m-bg)] text-[var(--m-error)] opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:border-[var(--m-error)] ${focusRing}`}
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
