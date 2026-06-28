import { redirect } from "next/navigation";

// Permanent redirect — the components showcase is now a tab under /brand.
export default function Page() {
  redirect("/brand?tab=components");
}
