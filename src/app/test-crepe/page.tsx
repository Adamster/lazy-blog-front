import { generateMeta } from "@/components/meta/meta-data";
import { Metadata } from "next";
import Home from "./page-edit";

export const metadata: Metadata = generateMeta({
  title: "Test",
  description: "Somewhere between procrastination and inspiration",
});

export default function RootPage() {
  return <Home />;
}
