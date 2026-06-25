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

/** Imperative handle the form's toolbar + pickers drive (insert an emoji char,
 *  insert a GIF/sticker image at the cursor, focus). */
export interface CommentEditorApi {
  /** Insert a plain-text string (an emoji) at the cursor. */
  insertText: (text: string) => void;
  /** Insert an inline image (a whitelisted GIF/sticker URL) at the cursor. */
  insertImage: (src: string, alt?: string) => void;
  /** Move focus back into the editable surface. */
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
  /** Initial markdown — read ONCE on mount (the editor owns the doc after). */
  markdown?: string;
  /** Debounced markdown emitter → the form's `body` state. */
  onChange?: (markdown: string) => void;
  /** Fires once the editor is live, handing the imperative API to the form. */
  onReady?: (api: CommentEditorApi) => void;
  /** Accessible name applied to the editable region. */
  ariaLabel?: string;
}

/**
 * Minimal WYSIWYG markdown editor for the COMMENT composer. Built directly on
 * `@milkdown/kit/core` with a curated tiny plugin set (see
 * `comment-editor-config.ts`) — NOT the heavy `Crepe` class the post editor
 * uses. Comments are TEXT + PICTURES only (no formatting marks): a picked
 * GIF/sticker lands as an inline image that shows the actual picture (never a
 * raw `![](url)` URL); emoji are plain text.
 *
 * Client-only (loaded via `dynamic(ssr:false)` from `comment-editor-wrapper`):
 * Milkdown is a browser editor with no SSR markup, and the comment composer only
 * mounts on an OPEN form (add or a single edit), so it's never instantiated per
 * comment for the read view.
 */
export default function CommentEditor({
  markdown = "",
  onChange,
  onReady,
  ariaLabel,
}: CommentEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Mount-once values, captured at first render so the init effect runs with
  // empty deps without reading changing props from a stale closure.
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
