import { redirect } from "next/navigation";

// Permanent redirect — the components showcase is now folded into the
// Design Guide tab under /brand.
export default function Page() {
  redirect("/brand?tab=guide");
}
