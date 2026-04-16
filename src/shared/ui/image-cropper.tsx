"use client";

import "react-advanced-cropper/dist/style.css";

import { Button, ButtonGroup } from "@heroui/react";
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
    <div className="flex flex-col gap-4 max-w-full">
      <Cropper
        ref={ref}
        src={src}
        stencilComponent={stencilShape === "circle" ? CircleStencil : undefined}
        stencilProps={stencilProps}
        sizeRestrictions={sizeRestrictions}
      />
      <div className="flex justify-end">
        <ButtonGroup>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={handleSave}
          >
            <RocketLaunchIcon className="h-4 w-4" />
            {saveLabel}
          </Button>
          <Button size="sm" variant="flat" isIconOnly onPress={onCancel}>
            <NoSymbolIcon className="h-4 w-4" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
