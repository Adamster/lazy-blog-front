import { generateMeta } from "@/utils/meta-data";
import { Metadata } from "next";
import ForgotPasswordClient from "./page-client";

export const metadata: Metadata = generateMeta({
  title: "Forgot Password",
});

export default function ForgotPassword() {
  return <ForgotPasswordClient />;
}
