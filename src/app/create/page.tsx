"use client";

import { useSession } from "next-auth/react";

import Head from "next/head";
import { useState } from "react";

import Loading from "@/components/loading";
import { CreateEdit } from "@/components/post/CreateEdit";
// import { useRouter } from 'next/dist/client/router';
import { apiClient } from "@/api/api-client";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
// import { useRouter } from "next/navigation";

// Component

const Create = () => {
  const { data: auth } = useSession();
  // const router = useRouter();

  const [requesting, setRequesting] = useState(false);

  const form = useForm({ shouldFocusError: false });
  const { reset } = form;

  const onSubmit = useMutation({
    mutationFn: (data: any) => {
      return apiClient.posts.apiPostsPost({
        createPostRequest: { userId: auth?.user.id, ...data },
      });
    },

    onSuccess: () => {
      toast.success("Это успех!");
      reset();
    },

    onError: (error: any) => {
      toast.error("Чё-то ошибка");
      console.log(error);
    },

    onSettled: () => {
      setRequesting(false);
    },
  });

  // const onSubmit = async (data: any) => {
  //   setRequesting(true);
  //   await axios
  //     .post(
  //       `${API_URL}/api/posts`,
  //       {
  //         userId: auth?.user.id,
  //         ...data,
  //       },
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${auth?.user.accessToken}`,
  //         },
  //       }
  //     )
  //     .then((response) => {
  //       toast.success("Это успех!");
  //       reset();
  //     })
  //     .catch((error) => {
  //       toast.error("Чё-то ошибка");
  //       console.log(error);
  //     })
  //     .finally(() => {
  //       setRequesting(false);
  //     });
  // };

  return (
    <>
      <Head>
        <title>Новый Пост | Not Lazy Blog</title>
      </Head>

      {requesting && <Loading />}

      <div className="p-8">
        <CreateEdit form={form} onSubmit={onSubmit.mutate} />
      </div>
    </>
  );
};

export default Create;
