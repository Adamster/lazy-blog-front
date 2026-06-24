import { Suspense } from "react";
import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import BrandPage from "./brand-page";

export const metadata: Metadata = generateMeta({
  title: "Brand Identity",
});

// `BrandPage` reads `useSearchParams` (the `?tab=`) — give it its own Suspense
// boundary (Next's requirement) instead of leaning on a global `loading.tsx`.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <BrandPage />
    </Suspense>
  );
}
