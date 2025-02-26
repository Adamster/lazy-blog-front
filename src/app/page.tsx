import { PageClient } from "@/app/page-client";
import { generateMeta } from "@/components/meta/meta-data";
import { Metadata } from "next";

export const metadata: Metadata = generateMeta({
  title: "Home",
  description: "Somewhere between procrastination and inspiration",
});

export default function RootPage() {
  return <PageClient />;
}
