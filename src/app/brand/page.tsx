import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import BrandPage from "./rewrite-brand-page";

export const metadata: Metadata = generateMeta({
  title: "Brand Identity",
});

export default function Page() {
  return <BrandPage />;
}
