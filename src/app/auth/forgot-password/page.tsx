import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import ForgotPassword from "./forgot-password";

export const metadata: Metadata = generateMeta({
  title: "Forgot Password",
});

export default function Page() {
  return <ForgotPassword />;
}
