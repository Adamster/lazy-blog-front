import { Suspense } from "react";
import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import BrandPage from "./brand-page";

export const metadata: Metadata = generateMeta({
  title: "Brand Identity",
  noindex: true,
});

// `BrandPage` reads `useSearchParams`, so it needs its own Suspense boundary (Next requirement).
export default function Page() {
  return (
    <Suspense fallback={null}>
      <BrandPage />
    </Suspense>
  );
}
