import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import CreatePageClient from "./create-page";

export const metadata: Metadata = generateMeta({
  title: "Create",
});

export default function Page() {
  return <CreatePageClient />;
}
