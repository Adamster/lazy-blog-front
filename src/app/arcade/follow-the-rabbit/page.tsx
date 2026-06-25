import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import SnakePage from "./snake-page";

export const metadata: Metadata = generateMeta({
  title: "Follow the White Rabbit",
  noindex: true,
});

export default function Page() {
  return <SnakePage />;
}
