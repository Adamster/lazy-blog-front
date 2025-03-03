"use client";

import { useState, useEffect } from "react";
import MilkdownCrepeViewer from "./MilkdownCrepeViewer"; // Убедитесь, что путь правильный
import CrepeEditor from "./milk-2";
import dynamic from "next/dynamic";

const PlaygroundMilkdown = dynamic(() => import("./milk-2"), {
  ssr: false,
  // loading: () => <Loading />,
});

export default function Home() {
  const [markdownContent, setMarkdownContent] = useState(`
# Пример Markdown
Это **тестовый** текст в Markdown.

- Пункт 1
- Пункт 2

[Ссылка на xAI](https://xai.ai)
  `);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsClient(true);
    }, 1000);
  }, []);

  // const ControlPanel = dynamic(() => import("./ControlPanel"), {
  //   ssr: false,
  //   loading: () => <Loading />,
  // });

  return (
    <main style={{ padding: "20px", display: "flex", gap: "20px" }}>
      {/* <div style={{ flex: 1 }}>
        <h2>Ввод</h2>
        <textarea
          value={markdownContent}
          onChange={(e) => setMarkdownContent(e.target.value)}
          style={{ width: "100%", height: "300px", fontFamily: "monospace" }}
        />
      </div> */}
      <div style={{ flex: 1 }}>
        <h2>Просмотр</h2>
        {/* {isClient && <CrepeEditor content={markdownContent} />} */}

        <div
          className={
            "h-[calc(50vh-2rem)] md:h-[calc(100vh-72px)] expanded relative col-span-2 mx-auto mt-16 mb-24 flex !h-fit min-h-[80vh] w-full max-w-5xl flex-col border-gray-300 dark:border-gray-600"
          }
        >
          <PlaygroundMilkdown />
        </div>

        <br />
      </div>
    </main>
  );
}
