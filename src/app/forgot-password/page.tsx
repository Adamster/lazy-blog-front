import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import ForgotPage from "./forgot-page";

export const metadata: Metadata = generateMeta({
  title: "Forgot Password",
});

export default function Page() {
  return <ForgotPage />;
}
