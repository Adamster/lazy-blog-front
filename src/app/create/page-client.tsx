/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { apiClient } from "@/api/api-client";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { UpdatePostRequest } from "@/api/apis";
import { Loading } from "@/components/loading";
import { PostForm } from "@/components/posts/post-form";
import { addToastError, addToastSuccess } from "@/components/toasts/toasts";
import { useUser } from "@/providers/user-provider";
import { useRouter } from "next/navigation";

const CreatePageClient = () => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [router, user]);

  const form = useForm<UpdatePostRequest>({
    defaultValues: {
      title: "",
      summary: "",
      body: "",
      coverUrl: "",
      isPublished: false,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: UpdatePostRequest) => {
      return apiClient.posts.createPost({
        createPostRequest: { userId: user?.id || "", ...data },
      });
    },
    onSuccess: () => {
      addToastSuccess("Post has been added");
      router.push("/");
    },
    onError: (error: any) => {
      addToastError("Error adding post", error);
    },
  });

  const onSubmit = () => {
    const data = form.getValues();

    form.trigger().then((isValid) => {
      if (isValid) {
        mutation.mutate(data);
      }
    });
  };

  return (
    <>
      {mutation.isPending && <Loading inline />}
      {user && <PostForm form={form} onSubmit={onSubmit} create={true} />}
    </>
  );
};

export default CreatePageClient;
