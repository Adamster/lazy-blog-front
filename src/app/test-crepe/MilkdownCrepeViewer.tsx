"use client"; // Указываем, что это клиентский компонент

import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe"; // Используем Crepe
import "@milkdown/crepe/theme/common/style.css"; // Базовые стили Crepe
import "@milkdown/crepe/theme/frame.css"; // Тема Frame
import type { FC } from "react";
import { useTheme } from "@/providers/theme-providers";
import { eclipse } from "@uiw/codemirror-theme-eclipse";

interface MilkdownCrepeViewerProps {
  content?: string;
}

const defaultMarkdown = `# Milkdown Crepe Viewer

> A minimal Markdown viewer with Crepe.

This is a demo for using Milkdown Crepe with **Next.js**.`;

export const MilkdownCrepeViewer: FC<MilkdownCrepeViewerProps> = ({
  content,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);

  const { isDarkTheme } = useTheme();

  useEffect(() => {
    if (!rootRef.current) return;

    crepeRef.current = new Crepe({
      root: rootRef.current,
      defaultValue: content || defaultMarkdown,
      featureConfigs: {
        [Crepe.Feature.CodeMirror]: {
          theme: isDarkTheme ? undefined : eclipse,
        },
        [Crepe.Feature.LinkTooltip]: {
          onCopyLink: () => {
            console.log("link copied");
            // toast("Link copied", "success");
          },
        },
      },
    });

    crepeRef.current.create().then(() => {
      console.log("Editor created");
    });

    return () => {
      crepeRef.current?.destroy();
      console.log("Editor destroyed");
    };
  }, [content]);

  return <div ref={rootRef} className="milkdown" />;
};

export default MilkdownCrepeViewer;
