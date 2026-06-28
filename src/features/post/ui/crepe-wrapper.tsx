import dynamic from "next/dynamic";
import { Loading } from "@/shared/ui";

// `ssr:false`: editor is create/edit-only (behind auth), not on the SEO read path.
export const CrepeEditor = dynamic(() => import("./crepe"), {
  ssr: false,
  loading: () => <Loading inline />,
});
