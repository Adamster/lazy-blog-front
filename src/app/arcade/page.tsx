import { Metadata } from "next";
import { ArcadePage } from "@/features/arcade/hub";
import { generateMeta } from "@/shared/lib/head/meta-data";

export const metadata: Metadata = generateMeta({
  title: "Arcade",
  noindex: true,
});

export default function Page() {
  return <ArcadePage />;
}
