import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import ComponentsPage from "./components-page";

export const metadata: Metadata = generateMeta({
  title: "Components",
});

export default function Page() {
  return <ComponentsPage />;
}
