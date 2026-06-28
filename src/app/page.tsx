import { Metadata } from "next";
import HomePage from "./home-page";
import { generateMeta } from "@/shared/lib/head/meta-data";

export const metadata: Metadata = generateMeta({
  title: "Home",
});

// No SSR feed seed — the home feed loads client-side; the meta tags above cover SEO.
export default function Page() {
  return <HomePage />;
}
