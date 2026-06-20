"use client";

import "react-advanced-cropper/dist/style.css";

import { NoSymbolIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { useRef } from "react";
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
  onCrop,
  onCancel,
}: ImageCropperProps) {
  const ref = useRef<CropperRef>(null);

  const handleSave = () => {
    const options =
      canvasWidth || canvasHeight
        ? { width: canvasWidth, height: canvasHeight }
        : undefined;
    const canvas = ref.current?.getCanvas(options);
    canvas?.toBlob((blob) => {
      if (blob) onCrop(blob);
    });
  };

  return (
    <div className="flex max-w-full flex-col gap-4">
      <Cropper
        ref={ref}
        src={src}
        stencilComponent={stencilShape === "circle" ? CircleStencil : undefined}
        stencilProps={stencilProps}
        sizeRestrictions={sizeRestrictions}
      />
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
    </div>
  );
}
