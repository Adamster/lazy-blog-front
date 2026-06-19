import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import BrandPage from "./brand-page-mono";

export const metadata: Metadata = generateMeta({
  title: "Brand Identity",
});

export default function Page() {
  return <BrandPage />;
}
