"use client";

import { useForm } from "react-hook-form";
import { UpdatePostRequest } from "@/shared/api/openapi";
import { PostForm } from "@/features/post/ui/post-form";
import { useCreatePost } from "@/features/post/model/use-create-post";
import { ProtectedRoute } from "@/features/auth/guards/protected-route";

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
    <ProtectedRoute>
      <PostForm
        form={form}
        onSubmit={onSubmit}
        isCreate={true}
        isPending={createPostMutation.isPending}
      />
    </ProtectedRoute>
  );
};

export default CreatePage;
