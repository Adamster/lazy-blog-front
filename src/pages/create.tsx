// import MDEditor from "@uiw/react-md-editor";
import { API_URL } from "@/utils/fetcher";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { authOptions } from "./api/auth/[...nextauth]";

import { useTheme } from "@/contexts/theme-context";
import "@uiw/react-md-editor/markdown-editor.css";
import dynamic from "next/dynamic";
import rehypeSanitize from "rehype-sanitize";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// Component

export default function Create() {
  const { data: session }: any = useSession();
  const { darkTheme } = useTheme();

  const [form, setForm] = useState({
    userId: "",
    title: "",
    coverUrl: "",
    summary: "",
  });

  const [body, setBody] = useState<string | undefined>("");

  useEffect(() => {
    setForm((values) => ({ ...values, userId: session?.user.id }));
  }, [session]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { title, coverUrl, summary, userId } = form;

    fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.user.token}`,
      },
      body: JSON.stringify({ userId, title, coverUrl, summary, body }),
    })
      .then((response) => {
        if (response.ok) {
          setBody("");
          setForm({
            ...form,
            title: "",
            summary: "",
          });
          alert("Успешно");
        } else {
          alert("Ошибкен");
          throw new Error("Error creating post");
        }
      })
      .catch((error) => {
        alert("Ошибкен");
        console.error(error);
      });
  };

  return (
    <>
      <Head>
        <title>Создаем Пост | Not Lazy Blog</title>
      </Head>

      <form
        className="rounded-md background-white p-8"
        method="POST"
        onSubmit={handleSubmit}
      >
        <div className="mb-6">
          <h3 className="text-2xl font-bold">Действуй, cоздавай контент </h3>
        </div>

        <div className="mb-4">
          <input
            className="input"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="Тайтл"
          />
        </div>

        <div className="mb-4">
          <input
            className="input"
            name="coverUrl"
            type="text"
            required
            value={form.coverUrl}
            onChange={handleChange}
            placeholder="Картиночка"
          />
        </div>

        <div className="mb-4">
          <input
            className="input"
            name="summary"
            type="text"
            required
            value={form.summary}
            onChange={handleChange}
            placeholder="Короткое описание"
          />
        </div>

        <div className="mb-6" data-color-mode="dark">
          <div className="wmde-markdown-var"> </div>
          <MDEditor
            previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
            value={body}
            onChange={setBody}
          />
        </div>

        <div>
          <button className="btn btn--primary mr-4" type="submit">
            Поехали
          </button>
        </div>
      </form>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
