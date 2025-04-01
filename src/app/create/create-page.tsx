"use client";

import { useForm } from "react-hook-form";
import { UpdatePostRequest } from "@/shared/api/openapi";
import { PostForm } from "@/features/post/ui/post-form";
import { IsAuth } from "@/features/auth/guards/is-auth";
import { ErrorMessage } from "@/shared/ui/error-message";
import { useCreatePost } from "@/features/post/model/use-create-post";

const CreatePage = () => {
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

  const createPostMutation = useCreatePost();

  const onSubmit = form.handleSubmit((data) => {
    createPostMutation.mutate(data);
  });

  return (
    <IsAuth fallback={<ErrorMessage error={"Not Found."} />}>
      <PostForm
        form={form}
        onSubmit={onSubmit}
        isCreate={true}
        isPending={createPostMutation.isPending}
      />
    </IsAuth>
  );
};

export default CreatePage;
