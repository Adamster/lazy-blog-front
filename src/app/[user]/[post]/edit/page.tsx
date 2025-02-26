import { generateMeta } from "@/components/meta/meta-data";
import { Metadata } from "next";

export const metadata: Metadata = generateMeta({
  title: "Edit",
  description: "Edit Post",
});

export default function PageEdit() {
  return <p>In progress</p>; //<PageEditClient />;
}
