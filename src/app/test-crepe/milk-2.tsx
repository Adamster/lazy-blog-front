"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { useTheme } from "@/providers/theme-providers";
import { eclipse } from "@uiw/codemirror-theme-eclipse";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import throttle from "lodash.throttle";
import { editorViewCtx } from "@milkdown/kit/core";

interface MilkdownCrepeViewerProps {
  content?: string;
}

const defaultMarkdown = `# Milkdown Crepe Viewer

> A minimal Markdown viewer with Crepe.

This is a demo for using Milkdown Crepe with **Next.js**.`;

export const CrepeEditor: React.FC<MilkdownCrepeViewerProps> = ({
  content,
}) => {
  const crepeRef = useRef<Crepe | null>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const loading = useRef(false);
  const { isDarkTheme } = useTheme();

  useLayoutEffect(() => {
    if (!divRef.current || loading.current) return;

    // Если редактор уже есть, удаляем перед созданием нового
    if (crepeRef.current) {
      crepeRef.current.destroy();
      crepeRef.current = null;
    }

    loading.current = true;

    const crepe = new Crepe({
      root: divRef.current,
      defaultValue: defaultMarkdown,
      featureConfigs: {
        [Crepe.Feature.CodeMirror]: {
          theme: isDarkTheme ? undefined : eclipse,
        },
        [Crepe.Feature.LinkTooltip]: {
          onCopyLink: () => {
            console.log("copy link");
          },
        },
      },
    });

    crepe.editor
      .config((ctx) => {
        ctx.get(listenerCtx).markdownUpdated(
          throttle((_, markdown) => {
            console.log("Updated Markdown:", markdown);
          }, 200)
        );
      })
      .use(listener);
    // .use(theme);

    crepe.create().then(() => {
      crepeRef.current = crepe;
      loading.current = false;

      crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        view.setProps({
          editable: () => false,
        });
      });
    });

    return () => {
      console.log("Destroying Crepe instance");
      if (crepeRef.current) {
        crepeRef.current.destroy();
        crepeRef.current = null;
      }
    };
  }, [isDarkTheme]); // Обновляем редактор при смене темы

  return <div className="crepe flex h-full flex-1 flex-col" ref={divRef} />;
};

export default CrepeEditor;
