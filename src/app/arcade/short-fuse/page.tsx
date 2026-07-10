import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import ShortFusePage from "./short-fuse-page";

export const metadata: Metadata = generateMeta({
  title: "Short Fuse",
  noindex: true,
});

export default function Page() {
  return <ShortFusePage />;
}
