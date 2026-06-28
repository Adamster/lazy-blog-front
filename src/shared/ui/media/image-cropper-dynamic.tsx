"use client";

import { lazy, Suspense } from "react";
import { Loading } from "../feedback/loading";
import type { ImageCropperProps } from "./image-cropper";

const LazyImageCropper = lazy(() => import("./image-cropper"));

/**
 * Lazily-loaded image cropper — the heavy `react-advanced-cropper` chunk loads
 * on demand (client-only), so it never weighs down the initial bundle. Plain
 * `React.lazy` + `Suspense` (not `next/dynamic`) so `shared/ui` stays
 * framework-agnostic; `"use client"` keeps it off the server like the old
 * `ssr: false` did.
 */
export function ImageCropper(props: ImageCropperProps) {
  return (
    <Suspense fallback={<Loading inline />}>
      <LazyImageCropper {...props} />
    </Suspense>
  );
}
