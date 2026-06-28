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
import { Button } from "../forms/button";

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
  hideActions?: boolean;
  /** Externally-driven crop trigger: a consumer footer drives export without a ref, which next/dynamic wouldn't forward across its ssr:false boundary. */
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

  // useEffectEvent keeps handleSave out of the deps so the effect fires only on a new signal.
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
          <Button onClick={handleSave} className="gap-2">
            <RocketLaunchIcon className="size-3.5" />
            {saveLabel}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="mono-icon-btn mono-focus size-9"
          >
            <NoSymbolIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
