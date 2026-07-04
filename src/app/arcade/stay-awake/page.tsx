import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import StayAwakePage from "./stay-awake-page";

export const metadata: Metadata = generateMeta({
  title: "Stay Awake",
  noindex: true,
});

export default function Page() {
  return <StayAwakePage />;
}
