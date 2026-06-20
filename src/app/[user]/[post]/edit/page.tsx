import { Metadata } from "next";
import { generateMeta } from "@/shared/lib/head/meta-data";
import EditPage from "./edit-page";

export const metadata: Metadata = generateMeta({
  title: "Edit",
});

export default function Page() {
  return <EditPage />;
}
