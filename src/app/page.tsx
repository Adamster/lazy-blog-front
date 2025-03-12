import { PageClient } from "@/app/page-client";
import { generateMeta } from "@/components/meta/meta-data";
import { Metadata } from "next";

export const metadata: Metadata = generateMeta({
  title: "Home",
});

export default function RootPage() {
  return <PageClient />;
}
