import { generateMeta } from "@/components/meta/meta-data";
import { Metadata } from "next";
import PageEditClient from "./page-client";

export const metadata: Metadata = generateMeta({
  title: "Edit",
  description: "Edit Post",
});

export default function PageEdit() {
  return <PageEditClient />;
}
