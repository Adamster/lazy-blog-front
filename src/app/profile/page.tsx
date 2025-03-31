import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import Profile from "./profile-page";

export const metadata: Metadata = generateMeta({
  title: "Profile",
});

export default function Page() {
  return <Profile />;
}
