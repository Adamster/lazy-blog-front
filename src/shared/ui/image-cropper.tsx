"use client";

import "react-advanced-cropper/dist/style.css";

import { NoSymbolIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { useEffect, useEffectEvent, useRef } from "react";
import {
  CircleStencil,
  Cropper,
  type CropperProps,
  type CropperRef,
} from "react-advanced-cropper";

type StencilProps = CropperProps["stencilProps"];
type SizeRestrictions = CropperProps["sizeRestrictions"];

export interface ImageCropperProps {
  src: string;
  stencilShape?: "rect" | "circle";
  stencilProps?: StencilProps;
  sizeRestrictions?: SizeRestrictions;
  canvasWidth?: number;
  canvasHeight?: number;
  saveLabel?: string;
  /** Hide the built-in Save/Cancel row (the consumer owns its own footer). */
  hideActions?: boolean;
  /**
   * Externally-driven crop trigger. When this number changes to a positive
   * value the current crop is exported via `onCrop` — lets a consumer footer
   * (e.g. the cover-crop modal) drive the export without a ref, which
   * `next/dynamic` would not forward across its `ssr:false` boundary.
   */
  cropSignal?: number;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  src,
  stencilShape = "rect",
  stencilProps,
  sizeRestrictions,
  canvasWidth,
  canvasHeight,
  saveLabel = "Save",
  hideActions = false,
  cropSignal = 0,
  onCrop,
  onCancel,
}: ImageCropperProps) {
  const cropperRef = useRef<CropperRef>(null);

  const handleSave = () => {
    const options =
      canvasWidth || canvasHeight
        ? { width: canvasWidth, height: canvasHeight }
        : undefined;
    const canvas = cropperRef.current?.getCanvas(options);
    canvas?.toBlob((blob) => {
      if (blob) onCrop(blob);
    });
  };

  // Fire the crop when an external consumer bumps `cropSignal`. `useEffectEvent`
  // keeps the export logic out of the dependency array so the effect runs only
  // on a new signal, not on every prop change.
  const exportCrop = useEffectEvent(() => handleSave());
  useEffect(() => {
    if (cropSignal > 0) exportCrop();
  }, [cropSignal]);

  return (
    <div className="flex max-w-full flex-col gap-4">
      <Cropper
        ref={cropperRef}
        src={src}
        stencilComponent={stencilShape === "circle" ? CircleStencil : undefined}
        stencilProps={stencilProps}
        sizeRestrictions={sizeRestrictions}
      />
      {hideActions ? null : (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="mono-cta inline-flex h-9 items-center gap-2 px-4 text-[14px] font-bold tracking-[0.06em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]"
          >
            <RocketLaunchIcon className="size-3.5" />
            {saveLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="mono-icon-btn size-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]"
          >
            <NoSymbolIcon className="size-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}
