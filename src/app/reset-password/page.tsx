import { generateMeta } from "@/utils/meta-data";
import { Metadata } from "next";
import ResetPasswordClient from "./page-client";

export const metadata: Metadata = generateMeta({
  title: "Reset Password",
});

export default function ResetPassword() {
  return <ResetPasswordClient />;
}
