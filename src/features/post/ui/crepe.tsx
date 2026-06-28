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
import { mediaEmbed } from "./editor-embed-node";

type ImageUploadHandler = (file: File) => Promise<string>;

interface CrepeEditorProps {
  /** Read once on mount — Crepe owns the document after. */
  markdown?: string;
  placeholder?: string;
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

// Client-only (create/edit, behind auth) — loaded via dynamic(ssr:false). The
// editable content uses `.mono-prose` so it renders 1:1 with the read view.
export default function CrepeEditor({
  markdown = "",
  placeholder,
  onChange,
}: CrepeEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [ready, setReady] = useState(false);

  const runCommand = useCallback<RunCommand>((cmd, payload) => {
    crepeRef.current?.editor.action(callCommand(cmd.key, payload));
  }, []);

  // Mount-once values so the init effect can run with empty deps without reading
  // changing props from a stale closure.
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

    // This upload bypasses the api-client middleware — refresh the token here so
    // an in-post image upload after idle doesn't silently 401.
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

  const onInsertImage = async (file: File) => {
    const src = await imageUploadHandler(file);
    if (!src) return;
    crepeRef.current?.editor.action(
      callCommand(insertImageCommand.key, { src })
    );
  };

  // The form value is synced OUT via debounced `onChange`, never pushed back in —
  // pushing it back caused cursor jumps / re-mount churn.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const crepe = new Crepe({
      root,
      defaultValue: initialMarkdownRef.current,
      features: {
        // OFF — its gutter/line-numbers theme diverged from the read view's plain
        // `<pre>` (styled by `.mono-prose .ProseMirror pre`).
        [Crepe.Feature.CodeMirror]: false,
        // OFF — depends on CodeMirror; leaving it on throws "enable CodeMirror to use LaTeX".
        [Crepe.Feature.Latex]: false,
        // OFF — the persistent toolbar replaces the floating bubble + slash menu.
        [Crepe.Feature.Toolbar]: false,
        [Crepe.Feature.BlockEdit]: false,
        [Crepe.Feature.LinkTooltip]: true,
        [Crepe.Feature.Placeholder]: true,
        // OFF — it painted a grey caret that disagreed with the native one.
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
      .use(smallMark)
      .use(effectMarks)
      .use(colorMarks)
      .use(mediaEmbed);

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
    // Mount-once: every value the effect reads is a ref, so empty deps is correct.
  }, []);

  return (
    <div>
      <EditorToolbar
        onCommand={runCommand}
        onInsertImage={onInsertImage}
        disabled={!ready}
      />
      {/* The 700 measure isn't on this wrapper — it lives ON `.ProseMirror`
          (centered), 1:1 with the read view (see crepe-overrides.scss). */}
      <div className="pt-10">
        <div className="milkdown mono-prose" ref={rootRef} />
      </div>
    </div>
  );
}
