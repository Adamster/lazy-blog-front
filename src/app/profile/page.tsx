import { Suspense } from "react";
import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import Profile from "./profile-page";

export const metadata: Metadata = generateMeta({
  title: "Profile",
});

// `Profile` reads `useSearchParams` (the active tab) — give it its own Suspense
// boundary (Next's requirement) instead of leaning on a global `loading.tsx`.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Profile />
    </Suspense>
  );
}
