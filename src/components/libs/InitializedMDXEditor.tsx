"use client";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useUser } from "@/providers/user-provider";
import { API_URL } from "@/utils/fetcher";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  ListsToggle,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { type ForwardedRef } from "react";

export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  const { auth } = useAuth();
  const { user } = useUser();

  const codeBlockLanguages = {
    html: "HTML",
    css: "CSS",
    js: "JavaScript",
    ts: "TypeScript",
    tsx: "TypeScript (React)",
    cs: "C#",
    cpp: "C++",
    java: "Java",
    python: "Python",
    json: "JSON",
    graphql: "GraphQL",
    sql: "SQL",
    md: "Markdown",
    sh: "Shell",
  };

  const imageUploadHandler = async (file: File) => {
    if (!user) {
      return "";
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/api/media/${user.id}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Uploading Error: ${response.status} ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      let imageUrl = "";

      if (contentType?.includes("application/json")) {
        const data = await response.json();
        imageUrl = data.url;
      } else {
        imageUrl = await response.text();
      }

      return imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return "";
    }
  };

  return (
    <MDXEditor
      plugins={[
        headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
        listsPlugin(),
        linkPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        tablePlugin(),
        linkDialogPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
        codeMirrorPlugin({
          codeBlockLanguages,
          codeMirrorExtensions: [oneDark],
        }),
        imagePlugin({
          imageUploadHandler,
        }),
        diffSourcePlugin({
          viewMode: "rich-text",
        }),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <DiffSourceToggleWrapper options={["source"]}>
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                {/* <Separator /> */}
                <ListsToggle options={["bullet", "number"]} />
                {/* <Separator /> */}
                <InsertImage />
                <InsertCodeBlock />
                <InsertTable />
                {/* <Separator /> */}
                <CreateLink />
              </DiffSourceToggleWrapper>
            </>
          ),
        }),
      ]}
      {...props}
      ref={editorRef}
    />
  );
}
