import { generateMeta } from "@/utils/meta-data";
import { Metadata } from "next";
import CreatePageClient from "./page-client";

export const metadata: Metadata = generateMeta({
  title: "New Post",
});

export default function CreatePage() {
  return <CreatePageClient />;
}
