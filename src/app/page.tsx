import { Metadata } from "next";
import HomePage from "./home-page";
import { generateMeta } from "@/shared/lib/head/meta-data";

export const metadata: Metadata = generateMeta({
  title: "Home",
});

export default function Page() {
  return <HomePage />;
}
