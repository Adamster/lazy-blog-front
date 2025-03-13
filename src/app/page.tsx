import { PageClient } from "@/app/page-client";
import { generateMeta } from "@/utils/meta-data";
import { Metadata } from "next";

export const metadata: Metadata = generateMeta({
  title: "Home",
});

export default function RootPage() {
  return <PageClient />;
}
