import dynamic from "next/dynamic";

/**
 * Client-only entry for the minimal comment WYSIWYG editor. `ssr:false` is
 * correct: Milkdown is a browser editor (no SSR markup) and the composer only
 * mounts on an OPEN form, never on the read path. A null fallback keeps the
 * first frame quiet — the toolbar is gated on the editor's `ready` flag in the
 * form, so there's nothing to show until Milkdown is live.
 */
export const CommentEditor = dynamic(() => import("./comment-editor"), {
  ssr: false,
});

export type { CommentEditorApi } from "./comment-editor";
