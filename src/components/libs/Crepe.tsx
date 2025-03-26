"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { API_URL } from "@/shared/consts";
import { useTheme } from "@/shared/providers/theme-providers";
import { useUser } from "@/shared/providers/user-provider";
import { Crepe } from "@milkdown/crepe";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import throttle from "lodash.throttle";
import { useLayoutEffect, useRef } from "react";

interface MilkdownCrepeViewerProps {
  markdown?: string;
  onChange: (markdown: string) => void;
}

export const CrepeEditor: React.FC<MilkdownCrepeViewerProps> = ({
  markdown,
  onChange,
}) => {
  const crepeRef = useRef<Crepe | null>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const loading = useRef(false);
  const { isDarkTheme } = useTheme();
  const { auth } = useAuth();
  const { user } = useUser();

  // ((file: File) => Promise<string>)
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

  useLayoutEffect(() => {
    if (!divRef.current || loading.current) return;

    if (crepeRef.current) {
      crepeRef.current.destroy();
      crepeRef.current = null;
    }

    loading.current = true;

    // create

    const crepe = new Crepe({
      root: divRef.current,
      defaultValue: markdown,

      features: {
        [Crepe.Feature.CodeMirror]: true,
        [Crepe.Feature.Latex]: false,
      },
      featureConfigs: {
        // [Crepe.Feature.CodeMirror]: {
        //   theme: isDarkTheme ? eclipse : undefined,
        // },
        [Crepe.Feature.ImageBlock]: {
          onUpload: imageUploadHandler,
        },
      },
    });

    crepe.editor
      .config((ctx) => {
        ctx.get(listenerCtx).markdownUpdated(
          throttle((_, markdown) => {
            onChange(markdown);
          }, 200)
        );
      })
      .use(listener);

    crepe.create().then(() => {
      crepeRef.current = crepe;
      loading.current = false;
    });

    return () => {
      console.log("Destroying Crepe instance");
      if (crepeRef.current) {
        crepeRef.current.destroy();
        crepeRef.current = null;
      }
    };
  }, [isDarkTheme, markdown]);

  return <div className="crepe" ref={divRef} />;
};

export default CrepeEditor;
