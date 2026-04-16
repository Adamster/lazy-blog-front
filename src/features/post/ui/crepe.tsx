"use client";

import "@milkdown/crepe/theme/common/style.css";
import "./crepe-overrides.scss";

import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { editorViewCtx, parserCtx } from "@milkdown/kit/core";
import { Slice } from "@milkdown/kit/prose/model";
import { useAuth } from "@/features/auth/model/use-auth";
import { useUser } from "@/shared/providers/user-provider";
import { API_URL } from "@/shared/types";
import { observeEmbeds, toEmbedUrl } from "../lib/embed-url";

const EMBED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 16.5v-9l6 4.5-6 4.5zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/></svg>`;

type ImageUploadHandler = (file: File) => Promise<string>;

interface CrepeComponentProps {
  markdown?: string;
  placeholder?: string;
  readonly?: boolean;
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

export default function CrepeComponent({
  markdown = "",
  placeholder,
  readonly = false,
  onChange,
}: CrepeComponentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { auth } = useAuth();
  const { user } = useUser();

  const imageUploadHandler: ImageUploadHandler = async (file) => {
    if (!user || !auth?.accessToken) return "";

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/api/media/${user.id}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        body: formData,
      });

      if (!response.ok) return "";

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        return data.url ?? "";
      }
      return await response.text();
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (!rootRef.current) return;

    const crepe = new Crepe({
      root: rootRef.current,
      defaultValue: markdown,
      features: {
        [Crepe.Feature.CodeMirror]: true,
        [Crepe.Feature.Latex]: true,
        [Crepe.Feature.Toolbar]: !readonly,
        [Crepe.Feature.BlockEdit]: !readonly,
        [Crepe.Feature.LinkTooltip]: !readonly,
        [Crepe.Feature.Placeholder]: !readonly,
        [Crepe.Feature.Cursor]: !readonly,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: placeholder
          ? { text: placeholder }
          : undefined,
        [Crepe.Feature.ImageBlock]: readonly
          ? undefined
          : { onUpload: imageUploadHandler },
        [Crepe.Feature.BlockEdit]: {
          buildMenu: (builder) => {
            builder.getGroup("advanced").addItem("embed", {
              label: "Embed",
              icon: EMBED_ICON,
              onRun: (ctx) => {
                const raw = window.prompt("Paste embed URL:");
                const url = raw?.trim();
                if (!url) return;
                if (!toEmbedUrl(url)) {
                  window.alert(
                    "This URL isn't recognized as a supported embed."
                  );
                  return;
                }

                const view = ctx.get(editorViewCtx);
                const parser = ctx.get(parserCtx);
                const doc = parser(`[Embed](${url})`);
                const paragraph = doc?.firstChild;
                if (!paragraph) return;

                setTimeout(() => {
                  const { state } = view;
                  const { $from } = state.selection;
                  const blockStart = $from.start();
                  const blockEnd = $from.pos;

                  let tr = state.tr;
                  if (blockEnd > blockStart) {
                    tr = tr.delete(blockStart, blockEnd);
                  }
                  tr = tr.replaceSelection(new Slice(paragraph.content, 0, 0));
                  view.dispatch(tr);
                  view.focus();
                }, 0);
              },
            });
          },
        },
      },
    });

    if (!readonly && onChangeRef.current) {
      const emit = debounce((md: string) => {
        onChangeRef.current?.(md);
      }, DEBOUNCE_MS);

      crepe.editor
        .config((ctx) => {
          ctx.get(listenerCtx).markdownUpdated((_, md) => emit(md));
        })
        .use(listener);
    }

    let disconnectEmbeds: (() => void) | null = null;

    crepe.create().then(() => {
      if (readonly) {
        crepe.setReadonly(true);
        if (rootRef.current) {
          disconnectEmbeds = observeEmbeds(rootRef.current);
        }
      }
      crepeRef.current = crepe;
    });

    return () => {
      disconnectEmbeds?.();
      crepe.destroy();
      crepeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readonly]);

  return <div className="milkdown" ref={rootRef} />;
}
