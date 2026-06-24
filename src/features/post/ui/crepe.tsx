"use client";

import "@milkdown/crepe/theme/common/style.css";
import "./crepe-overrides.scss";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crepe } from "@milkdown/crepe";
import { callCommand } from "@milkdown/kit/utils";
import { insertImageCommand } from "@milkdown/kit/preset/commonmark";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { useAuth, useUser } from "@/entities/session";
import { API_URL } from "@/shared/types";
import { getValidAccessToken } from "@/shared/lib/auth-refresh";
import { EditorToolbar, type RunCommand } from "./editor-toolbar";
import { smallMark } from "./editor-small-mark";
import { effectMarks } from "./editor-effect-marks";
import { colorMarks } from "./editor-color-marks";

type ImageUploadHandler = (file: File) => Promise<string>;

interface CrepeEditorProps {
  /** Initial markdown. Read once on mount (Crepe owns the document after). */
  markdown?: string;
  placeholder?: string;
  /** Debounced markdown emitter for the form's `body` field. */
  onChange?: (markdown: string) => void;
}

const DEBOUNCE_MS = 200;

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * WYSIWYG markdown editor (Milkdown/Crepe). Edits styled rich text directly and
 * emits markdown. The editable content is wrapped in `.mono-prose` so it renders
 * with the SAME `prose.css` rules as the server-rendered read view (`<PostBody>`)
 * — type a heading and it looks identical to the published page.
 *
 * Client-only by design (it's create/edit, behind auth) — loaded via
 * `dynamic(ssr:false)` from `crepe-wrapper.tsx`. Not on the SEO read path.
 */
export default function CrepeEditor({
  markdown = "",
  placeholder,
  onChange,
}: CrepeEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  // Gates the toolbar until the editor has finished mounting.
  const [ready, setReady] = useState(false);

  // Dispatch a Milkdown command from the persistent toolbar into the live
  // editor. Mutations fire the `markdownUpdated` listener → debounced `onChange`,
  // so the form's `body` stays in sync through the existing path (no new flow).
  const runCommand = useCallback<RunCommand>((cmd, payload) => {
    crepeRef.current?.editor.action(callCommand(cmd.key, payload));
  }, []);

  // Mount-once values, captured at first render so the init effect can run with
  // empty deps without reading changing props from a stale closure.
  const initialMarkdownRef = useRef(markdown);
  const placeholderRef = useRef(placeholder);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const { auth } = useAuth();
  const { user } = useUser();
  const authRef = useRef({ auth, user });
  useEffect(() => {
    authRef.current = { auth, user };
  });

  const imageUploadHandler: ImageUploadHandler = async (file) => {
    const { user: u } = authRef.current;
    if (!u) return "";

    // Proactively refresh an expired token (this upload bypasses the api-client
    // middleware) so an in-post image upload after idle doesn't silently 401.
    const accessToken = await getValidAccessToken();
    if (!accessToken) return "";

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/api/media/${u.id}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!response.ok) return "";

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = (await response.json()) as { url?: string };
        return data.url ?? "";
      }
      return await response.text();
    } catch {
      return "";
    }
  };

  // Toolbar Image button → file picker hands the chosen file here. Reuse the
  // same authed upload as Crepe's own ImageBlock, then dispatch
  // `insertImageCommand` so the node lands at the selection — the mutation
  // fires `markdownUpdated` and the body stays synced via the existing path.
  const onInsertImage = async (file: File) => {
    const src = await imageUploadHandler(file);
    if (!src) return;
    crepeRef.current?.editor.action(
      callCommand(insertImageCommand.key, { src })
    );
  };

  // Mount the editor once. Crepe owns the document lifecycle; the form value is
  // synced out via the debounced `onChange`, never pushed back in (avoids cursor
  // jumps / re-mount churn). `markdown`/`placeholder` are read on mount only.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const crepe = new Crepe({
      root,
      defaultValue: initialMarkdownRef.current,
      features: {
        // CodeMirror OFF — its gutter/line-numbers/syntax theme diverged from
        // the read view's plain `<pre>`. A plain code block styled by
        // `.mono-prose .ProseMirror pre` matches the published page 1:1.
        [Crepe.Feature.CodeMirror]: false,
        // LaTeX depends on CodeMirror (and the blog doesn't need math), so it's
        // off too — leaving it on throws "enable CodeMirror to use LaTeX".
        [Crepe.Feature.Latex]: false,
        // Floating selection bubble OFF — the persistent toolbar replaces it.
        [Crepe.Feature.Toolbar]: false,
        // Slash menu + block handles OFF — the persistent toolbar is now the
        // single source of formatting (every block action lives there).
        [Crepe.Feature.BlockEdit]: false,
        [Crepe.Feature.LinkTooltip]: true,
        [Crepe.Feature.Placeholder]: true,
        // Virtual cursor OFF — it painted a grey caret over text that disagreed
        // with the native one; the native accent caret is consistent.
        [Crepe.Feature.Cursor]: false,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: placeholderRef.current
          ? { text: placeholderRef.current }
          : undefined,
        [Crepe.Feature.ImageBlock]: { onUpload: imageUploadHandler },
      },
    });

    const emit = debounce(
      (md: string) => onChangeRef.current?.(md),
      DEBOUNCE_MS
    );
    crepe.editor
      .config((ctx) => {
        ctx.get(listenerCtx).markdownUpdated((_, md) => emit(md));
      })
      .use(listener)
      // Custom inline "small" mark (`:small[…]`) — toolbar SM toggles it, it
      // round-trips through markdown as a remark directive. See editor-small-mark.
      .use(smallMark)
      // Custom inline brand effects (`:glitch[…]` / `:matrix[…]`) — toolbar
      // Effects ▾ toggles them; they round-trip as remark directives and reuse
      // smallMark's single remark-directive registration. See editor-effect-marks.
      .use(effectMarks)
      // Custom inline text-colour marks (`:primary[…]` / `:muted[…]` /
      // `:error[…]`) — toolbar Text-colour ▾ sets them (mutually exclusive;
      // Default clears). Same remark-directive reuse. See editor-color-marks.
      .use(colorMarks);

    crepeRef.current = crepe;
    let alive = true;
    void crepe.create().then(() => {
      if (alive) setReady(true);
    });

    return () => {
      alive = false;
      crepeRef.current = null;
      void crepe.destroy();
    };
    // Mount-once: every value the effect reads is a ref (stable identity), so
    // the empty dep array is correct and complete.
  }, []);

  return (
    <div>
      {/* Persistent toolbar = the top edge of the framed writing column. */}
      <EditorToolbar
        onCommand={runCommand}
        onInsertImage={onInsertImage}
        disabled={!ready}
      />
      {/* Sheet: a closed 2px box (the toolbar caps the top), the page background,
          and a 40px inset so text never touches the walls. */}
      <div className="min-h-[40vh] border-x-2 border-b-2 border-[var(--m-dim)] bg-[var(--m-bg)] p-7 md:p-10">
        <div className="milkdown mono-prose" ref={rootRef} />
      </div>
    </div>
  );
}
