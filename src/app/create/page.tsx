import { generateMeta } from "@/components/meta/meta-data";
import { Metadata } from "next";
import CreatePageClient from "./page-client";

export const metadata: Metadata = generateMeta({
  title: "Create",
  description: "Create a new Post",
});

export default function CreatePage() {
  return <CreatePageClient />;
}
