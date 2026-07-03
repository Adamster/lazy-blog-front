import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import SnakeClassicPage from "./snake-classic-page";

export const metadata: Metadata = generateMeta({
  title: "Snake",
  noindex: true,
});

export default function Page() {
  return <SnakeClassicPage />;
}
