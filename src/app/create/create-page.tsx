/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { apiClient } from "@/shared/api/api-client";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { UpdatePostRequest } from "@/shared/api/openapi";
import { Loading } from "@/shared/ui/loading";
import { PostForm } from "@/features/post/ui/post-form";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useRouter } from "next/navigation";
import IsAuth from "@/features/auth/guards/is-auth";
import { ErrorMessage } from "@/shared/ui/error-message";
import { useUser } from "@/shared/providers/user-provider";

const CreatePage = () => {
  const router = useRouter();
  const { user } = useUser();

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
    <IsAuth fallback={<ErrorMessage error={"Not Found."} />}>
      {mutation.isPending && <Loading inline />}
      {<PostForm form={form} onSubmit={onSubmit} create={true} />}
    </IsAuth>
  );
};

export default CreatePage;
