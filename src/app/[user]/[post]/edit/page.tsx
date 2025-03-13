import { generateMeta } from "@/utils/meta-data";
import { Metadata } from "next";
import PageEditClient from "./page-client";

export const metadata: Metadata = generateMeta({
  title: "Edit Post",
});

export default function PageEdit() {
  return <PageEditClient />;
}
