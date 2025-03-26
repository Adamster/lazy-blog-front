import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import ResetPage from "./reset-page";

export const metadata: Metadata = generateMeta({
  title: "Reset Password",
});

export default function Page() {
  return <ResetPage />;
}
