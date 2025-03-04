import dynamic from "next/dynamic";
import { memo, forwardRef } from "react";
import { type MDXEditorMethods, type MDXEditorProps } from "@mdxeditor/editor";
import { Loading } from "../loading";

const Editor = dynamic(() => import("./InitializedMDXEditor"), {
  ssr: false,
  loading: () => <Loading inline />,
});

export const MarkEditor = memo(
  forwardRef<MDXEditorMethods, MDXEditorProps>(({ ...props }, ref) => (
    <Editor {...props} editorRef={ref} />
  ))
);

MarkEditor.displayName = "MarkEditor";
