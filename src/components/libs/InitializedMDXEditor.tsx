"use client";
import React, { useState, type ForwardedRef } from "react";
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertCodeBlock,
  InsertImage,
  InsertThematicBreak,
  ListsToggle,
  imagePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  Separator,
  linkPlugin,
  linkDialogPlugin,
  BlockTypeSelect,
  InsertTable,
  tablePlugin,
  DiffSourceToggleWrapper,
  diffSourcePlugin,
} from "@mdxeditor/editor";
import { API_URL } from "@/utils/fetcher";
import "@mdxeditor/editor/style.css";
import { useAuth } from "@/providers/auth-provider";
import { oneDark } from "@codemirror/theme-one-dark";

// Компонент кнопки для вставки отступа (HTML-блока с margin)
function InsertSpacingButton({
  editorRef,
}: {
  editorRef: ForwardedRef<MDXEditorMethods> | null;
}) {
  const handleInsertSpacing = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (editorRef && "current" in editorRef && editorRef.current) {
      const spacingHTML = "\n\n<div style='margin-bottom:2em;'></div>\n\n";
      editorRef.current.insertMarkdown(spacingHTML);
    }
  };

  return (
    <button onClick={handleInsertSpacing} style={{ marginRight: "8px" }}>
      Вставить отступ
    </button>
  );
}

export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  const { auth, user } = useAuth();
  const [prevMark] = useState<string>(props.markdown);

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
  };

  const imageUploadHandler = async (file: File) => {
    if (!user) {
      console.error("Ошибка: пользователь не аутентифицирован.");
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
          `Ошибка загрузки: ${response.status} ${response.statusText}`
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

      console.log("Загруженное изображение:", imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Ошибка при загрузке изображения:", error);
      return "";
    }
  };

  return (
    <MDXEditor
      plugins={[
        headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4, 5] }),
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
          diffMarkdown: prevMark ? prevMark : props.markdown,
          viewMode: "rich-text",
        }),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <DiffSourceToggleWrapper>
                {/* Добавляем нашу кастомную кнопку для вставки отступа */}
                {/* <InsertSpacingButton editorRef={editorRef} /> */}
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <Separator />
                <CreateLink />
                <InsertCodeBlock />
                <InsertImage />
                <InsertTable />
                <ListsToggle options={["bullet"]} />
                <Separator />
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
