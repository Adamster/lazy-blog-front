"use client";

import { apiClient } from "@/api/api-client";
import ErrorMessage from "@/components/errorMessages/ErrorMessage";
import Loading from "@/components/loading";
import { CreateEdit } from "@/components/post/CreateEdit";
import { API_URL } from "@/utils/fetcher";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useParams, useRouter } from "next/navigation";
// import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

const PostEdit = () => {
  const { data: auth } = useSession();
  const router = useRouter();

  const params = useParams();
  const slug = params?.post as string;

  const [requesting, setRequesting] = useState(false);

  const {
    data: values,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["apiPostsSlugGet", slug],
    queryFn: () => apiClient.posts.apiPostsSlugGet({ slug }),
    enabled: !!slug,
  });

  const form = useForm({
    shouldFocusError: false,
    values,
  });

  const isAuthor = useMemo(() => {
    return auth?.user?.id && values?.author?.id === auth?.user?.id;
  }, [auth?.user?.id, values?.author?.id]);

  useEffect(() => {
    if (!isLoading && !isAuthor) {
      router.replace("/");
    }
  }, [isLoading, isAuthor, router]);

  const onSubmit = async (data: any) => {
    setRequesting(true);

    await axios
      .put(
        `${API_URL}/api/posts/${values?.id}`,
        { ...data, isPublished: true },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth?.user.accessToken}`,
          },
        }
      )
      .then((response) => {
        toast.success("Это успех!");
      })
      .catch(({ response }) => {
        toast.error("Чё-то ошибка");
        console.log(error);
      })
      .finally(() => {
        setRequesting(false);
      });
  };

  const onDelete = async () => {
    setRequesting(true);

    await axios
      .delete(`${API_URL}/api/posts/${values?.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.user.accessToken}`,
        },
      })
      .then((response) => {
        toast.success("Это успех!");
        router.back();
      })
      .catch(({ response }) => {
        toast.error("Чё-то ошибка");
      })
      .finally(() => {
        setRequesting(false);
      });
  };

  if (error) return <ErrorMessage />;

  return (
    <>
      <Head>
        <title>Редактор | Not Lazy Blog</title>
      </Head>

      {(isLoading || requesting) && <Loading />}

      <div className="wrapper p-8">
        {values && isAuthor && (
          <CreateEdit
            form={form}
            edit={true}
            onSubmit={onSubmit}
            onDelete={onDelete}
          />
        )}
      </div>
    </>
  );
};

export default PostEdit;
