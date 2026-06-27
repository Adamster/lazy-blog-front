import dynamic from "next/dynamic";
import { Loading } from "@/shared/ui/feedback/loading";

/**
 * Client-only entry for the WYSIWYG editor. `ssr:false` is correct here: the
 * editor is create/edit-only (behind auth) and not on the SEO read path — the
 * public post body is server-rendered separately via `<PostBody>`.
 */
export const CrepeEditor = dynamic(() => import("./crepe"), {
  ssr: false,
  loading: () => <Loading inline />,
});
