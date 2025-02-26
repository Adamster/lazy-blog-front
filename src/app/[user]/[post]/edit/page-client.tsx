"use client";

import { apiClient } from "@/api/api-client";
import { Loading } from "@/components/loading";
import { CreateEdit } from "@/components/post/CreateEdit";
import { useAuth } from "@/providers/auth-provider";
import { API_URL } from "@/utils/fetcher";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Head from "next/head";
import { useParams, useRouter } from "next/navigation";
// import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

const PageEditClient = () => {
  const { user } = useAuth();
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
    queryFn: () => apiClient.posts.getPostsBySlug({ slug }),
    enabled: !!slug,
  });

  const form = useForm({
    shouldFocusError: false,
    values,
  });

  const isAuthor = user?.id === values?.author.id;

  useEffect(() => {
    if (!user && !isAuthor) {
      router.push("/");
    }
  }, [user, isAuthor]);

  const onSubmit = async (data: any) => {
    setRequesting(true);

    // await axios
    //   .put(
    //     `${API_URL}/api/posts/${values?.id}`,
    //     { ...data, isPublished: true },
    //     {
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${auth?.user.accessToken}`,
    //       },
    //     }
    //   )
    //   .then((response) => {
    //     toast.success("Это успех!");
    //   })
    //   .catch(({ response }) => {
    //     toast.error("Чё-то ошибка");
    //     console.log(error);
    //   })
    //   .finally(() => {
    //     setRequesting(false);
    //   });
  };

  // const onDelete = async () => {
  //   setRequesting(true);

  //   await axios
  //     .delete(`${API_URL}/api/posts/${values?.id}`, {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${auth?.user.accessToken}`,
  //       },
  //     })
  //     .then((response) => {
  //       toast.success("Это успех!");
  //       router.back();
  //     })
  //     .catch(({ response }) => {
  //       toast.error("Чё-то ошибка");
  //     })
  //     .finally(() => {
  //       setRequesting(false);
  //     });
  // };

  // if (error) return <ErrorMessage />;

  return (
    <>
      {isLoading && <Loading />}

      {/* {values && isAuthor && (
          <CreateEdit
            form={form}
            edit={true}
            onSubmit={onSubmit}
            // onDelete={onDelete}
          />
        )} */}
    </>
  );
};

export default PageEditClient;
