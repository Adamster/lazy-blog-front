import { Metadata } from "next";
import ProfilePage from "./profile-page";
import { generateMeta } from "@/shared/lib/head/meta-data";

export const metadata: Metadata = generateMeta({
  title: "Profile",
});

export default function Page() {
  return <ProfilePage />;
}
