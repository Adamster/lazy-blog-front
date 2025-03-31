import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import ResetPassword from "./reset-password";

export const metadata: Metadata = generateMeta({
  title: "Reset Password",
});

export default function Page() {
  return <ResetPassword />;
}
