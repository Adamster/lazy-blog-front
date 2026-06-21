"use client";

import { useForm } from "react-hook-form";
import { UpdatePostRequest } from "@/shared/api/openapi";
import { PostForm } from "@/features/post/ui/post-form";
import { useCreatePost } from "@/features/post/model/use-create-post";
import { ProtectedRoute } from "@/entities/session";

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
      <div
        className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <PostForm
          form={form}
          onSubmit={onSubmit}
          isPending={createPostMutation.isPending}
        />
      </div>
    </ProtectedRoute>
  );
};

export default CreatePage;
