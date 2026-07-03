import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import Page2048 from "./page-2048";

export const metadata: Metadata = generateMeta({
  title: "2048",
  noindex: true,
});

export default function Page() {
  return <Page2048 />;
}
