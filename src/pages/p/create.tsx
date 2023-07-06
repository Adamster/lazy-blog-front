import { useSession } from "next-auth/react";

import Head from "next/head";
import { useState } from "react";

import Loading from "@/components/loading";
import { CreateEdit } from "@/components/post/CreateEdit";
import { API_URL } from "@/utils/fetcher";
import axios from "axios";
import { useRouter } from "next/dist/client/router";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

// Component

const Create = () => {
  const { data: auth } = useSession();
  const router = useRouter();

  const [requesting, setRequesting] = useState(false);

  const form = useForm({ shouldFocusError: false });
  const { reset } = form;

  const onSubmit = async (data: any) => {
    setRequesting(true);

    await axios
      .post(
        `${API_URL}/posts`,
        {
          userId: auth?.user.id,
          ...data,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth?.user.token}`,
          },
        }
      )
      .then((response) => {
        toast.success("Это успех!");
        reset();
      })
      .catch((error) => {
        toast.error("Чё-то ошибка");
        console.log(error);
      })
      .finally(() => {
        setRequesting(false);
      });
  };

  return (
    <>
      <Head>
        <title>Новый Пост | Not Lazy Blog</title>
      </Head>

      {requesting && <Loading />}

      <CreateEdit form={form} onSubmit={onSubmit} />
    </>
  );
};

export default Create;
