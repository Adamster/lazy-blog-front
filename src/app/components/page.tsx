import { redirect } from "next/navigation";

// The components showcase now lives as a tab inside the brand reference.
// Keep this route as a permanent redirect so any existing link still resolves.
export default function Page() {
  redirect("/brand?tab=components");
}
