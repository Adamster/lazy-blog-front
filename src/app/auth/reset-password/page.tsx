import { Suspense } from "react";
import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import ResetPassword from "./reset-password";

export const metadata: Metadata = generateMeta({
  title: "Reset Password",
});

// `ResetPassword` reads `useSearchParams`, so it needs its own Suspense boundary (Next requirement).
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  );
}
