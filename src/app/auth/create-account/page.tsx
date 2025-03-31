import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import CreateAccount from "./create-account";

export const metadata: Metadata = generateMeta({
  title: "Create an Account",
});

export default function Page() {
  return <CreateAccount />;
}
