import { Suspense } from "react";
import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import ResetPassword from "./reset-password";

export const metadata: Metadata = generateMeta({
  title: "Reset Password",
});

// `ResetPassword` reads `useSearchParams` (the reset token) — give it its own
// Suspense boundary (Next's requirement) instead of leaning on a global
// `loading.tsx`.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  );
}
