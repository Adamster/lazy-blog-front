import dynamic from "next/dynamic";
import { forwardRef } from "react";
import { type MDXEditorMethods, type MDXEditorProps } from "@mdxeditor/editor";
import { Loading } from "@/shared/ui/loading";

const Editor = dynamic(() => import("./markdown-editor"), {
  ssr: false,
  loading: () => <Loading inline />,
});

export const MarkdownWrapper = forwardRef<MDXEditorMethods, MDXEditorProps>(
  (props, ref) => <Editor {...props} editorRef={ref} />
);

MarkdownWrapper.displayName = "MarkEditor";
