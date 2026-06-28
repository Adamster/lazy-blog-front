"use client";

import "./comment-editor.scss";

import { useEffect, useRef } from "react";
import {
  Editor,
  rootCtx,
  defaultValueCtx,
  editorViewCtx,
  editorViewOptionsCtx,
} from "@milkdown/kit/core";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { history } from "@milkdown/kit/plugin/history";
import { callCommand } from "@milkdown/kit/utils";
import { commentMarks, insertImageCommand } from "./comment-editor-config";

export interface CommentEditorApi {
  insertText: (text: string) => void;
  insertImage: (src: string, alt?: string) => void;
  focus: () => void;
}

const DEBOUNCE_MS = 150;

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

interface CommentEditorProps {
  // Read ONCE on mount — the editor owns the doc after, won't react to prop changes.
  markdown?: string;
  onChange?: (markdown: string) => void;
  onReady?: (api: CommentEditorApi) => void;
  ariaLabel?: string;
}

export default function CommentEditor({
  markdown = "",
  onChange,
  onReady,
  ariaLabel,
}: CommentEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Mount-once values captured at first render, so the init effect can run with empty deps without stale-closure props.
  const initialMarkdownRef = useRef(markdown);
  const ariaLabelRef = useRef(ariaLabel);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onChangeRef.current = onChange;
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const emit = debounce(
      (md: string) => onChangeRef.current?.(md),
      DEBOUNCE_MS
    );

    let alive = true;
    const editorPromise = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, initialMarkdownRef.current);
        // Land role/label on the actual contenteditable (`.ProseMirror`).
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          attributes: {
            role: "textbox",
            "aria-multiline": "true",
            ...(ariaLabelRef.current
              ? { "aria-label": ariaLabelRef.current }
              : {}),
          },
        }));
        ctx.get(listenerCtx).markdownUpdated((_, md) => emit(md));
      })
      .use(listener)
      .use(history)
      .use(commentMarks)
      .create();

    void editorPromise.then((editor) => {
      if (!alive) {
        void editor.destroy();
        return;
      }

      const focus = () =>
        editor.action((ctx) => ctx.get(editorViewCtx).focus());

      onReadyRef.current?.({
        insertText: (text) =>
          editor.action((ctx) => {
            const view = ctx.get(editorViewCtx);
            view.dispatch(view.state.tr.insertText(text));
            view.focus();
          }),
        insertImage: (src, alt = "GIF") => {
          editor.action(callCommand(insertImageCommand.key, { src, alt }));
          focus();
        },
        focus,
      });
    });

    return () => {
      alive = false;
      void editorPromise.then((editor) => editor.destroy());
    };
    // Mount-once: every value read is a stable ref.
  }, []);

  return <div ref={rootRef} className="mono-comment-editor" />;
}
