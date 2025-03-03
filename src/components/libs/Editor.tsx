// ForwardRefEditor.tsx
import dynamic from "next/dynamic";
import { forwardRef } from "react";
import { type MDXEditorMethods, type MDXEditorProps } from "@mdxeditor/editor";
import { Loading } from "../loading";

const Editor = dynamic(() => import("./InitializedMDXEditor"), {
  ssr: false,
  loading: () => <Loading inline />,
});

console.log(Editor);

export const MarkEditor = forwardRef<MDXEditorMethods, MDXEditorProps>(
  ({ ...props }, ref) => <Editor {...props} editorRef={ref} />
);

MarkEditor.displayName = "ForwardRefEditor";
