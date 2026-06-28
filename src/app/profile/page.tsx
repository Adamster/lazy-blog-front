import { Suspense } from "react";
import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import Profile from "./profile-page";

export const metadata: Metadata = generateMeta({
  title: "Profile",
});

// `Profile` reads `useSearchParams`, so it needs its own Suspense boundary (Next requirement).
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Profile />
    </Suspense>
  );
}
