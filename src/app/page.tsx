import { Metadata } from "next";
import HomePage from "./home-page";
import { generateMeta } from "@/shared/lib/head/meta-data";

export const metadata: Metadata = generateMeta({
  title: "Home",
});

// No SSR feed seed — the home feed loads client-side. The blog is small and we
// don't need every article in the crawl; the social/SEO meta tags above are
// enough, and individual article pages stay server-rendered for their own SEO.
export default function Page() {
  return <HomePage />;
}
