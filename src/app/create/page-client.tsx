/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import { apiClient } from "@/api/api-client";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAuth } from "@/providers/auth-provider";
import { Loading } from "@/components/loading";
import { addToastError, addToastSuccess } from "@/helpers/toasts";
import { useRouter } from "next/navigation";
import { UpdatePostRequest } from "@/api/apis";
import { PostForm } from "@/components/posts/post-form";

const CreatePageClient = () => {
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<UpdatePostRequest>({
    defaultValues: {
      title: "",
      summary: "",
      body: "",
      coverUrl: "",
      isPublished: true,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [router, user]);

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
