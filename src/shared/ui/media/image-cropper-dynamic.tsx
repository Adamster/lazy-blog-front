"use client";

import { lazy, Suspense } from "react";
import { Loading } from "../feedback/loading";
import type { ImageCropperProps } from "./image-cropper";

const LazyImageCropper = lazy(() => import("./image-cropper"));

// React.lazy + Suspense (not next/dynamic) so shared/ui stays framework-agnostic; the heavy cropper chunk loads on demand.
export function ImageCropper(props: ImageCropperProps) {
  return (
    <Suspense fallback={<Loading inline />}>
      <LazyImageCropper {...props} />
    </Suspense>
  );
}
