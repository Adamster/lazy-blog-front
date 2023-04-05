// import MDEditor from "@uiw/react-md-editor";
import { API_URL } from "@/utils/fetcher";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { authOptions } from "./api/auth/[...nextauth]";

import "@uiw/react-md-editor/markdown-editor.css";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// Component

export default function Home() {
  const { data: session }: any = useSession();

  const [form, setForm] = useState({
    userId: "",
    title: "",
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
    const { title, summary, userId } = form;

    fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.user.token}`,
      },
      body: JSON.stringify({ userId, title, summary, body }),
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
        className="rounded-md bg-white p-8"
        method="POST"
        onSubmit={handleSubmit}
      >
        <div className="mb-6">
          <h3 className="text-2xl font-bold">Го, cоздавай контент </h3>
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
            name="summary"
            type="text"
            required
            value={form.summary}
            onChange={handleChange}
            placeholder="Короткое описание"
          />
        </div>

        <div className="mb-6">
          <MDEditor value={body} onChange={setBody} />
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
