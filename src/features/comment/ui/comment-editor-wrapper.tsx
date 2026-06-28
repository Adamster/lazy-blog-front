import dynamic from "next/dynamic";

// ssr:false: Milkdown is a browser editor (no SSR markup) and the composer only mounts on an OPEN form.
export const CommentEditor = dynamic(() => import("./comment-editor"), {
  ssr: false,
});

export type { CommentEditorApi } from "./comment-editor";
