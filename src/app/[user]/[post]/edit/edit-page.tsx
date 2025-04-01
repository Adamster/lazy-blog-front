/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { apiClient } from "@/shared/api/api-client";
import { UpdatePostRequest } from "@/shared/api/openapi";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import ConfirmDeleteModal from "@/shared/ui/confirmation-modal";
import { PostForm } from "@/features/post/ui/post-form";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { IsAuthor } from "@/features/auth/guards/is-author";
import { useUser } from "@/shared/providers/user-provider";
import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IsAuth } from "@/features/auth/guards/is-auth";
import { useUpdatePost } from "@/features/post/model/use-update-post";
import { usePostBySlug } from "@/features/post/model/use-post-by-slug";

const EditPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const slug = params?.post as string;
  const { data: postData, error, isLoading } = usePostBySlug(slug);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAuthor = user?.id === postData?.author.id;

  const form = useForm<UpdatePostRequest>({
    mode: "onChange",
  });

  useEffect(() => {
    if (postData) {
      form.reset({
        title: postData.title,
        summary: postData.summary || undefined,
        slug: postData.slug,
        body: postData.body,
        coverUrl: postData.coverUrl || undefined,
        tags: [...postData.tags.map((tag) => tag.tagId)],
        isPublished: postData.isPublished,
      });
    }
  }, [postData]);

  const updatePostMutation = useUpdatePost();

  const onSubmit = form.handleSubmit((data) => {
    updatePostMutation.mutate({
      id: postData?.id ?? "",
      updatePostRequest: data,
    });
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiClient.posts.deletePost({
        id: postData?.id || "",
      }),

    onSuccess: () => {
      addToastSuccess("Post has been deleted");
      router.push("/");
    },

    onError: (error: any) => {
      addToastError("Error deleting post", error);
    },
  });

  const onDelete = () => {
    setIsModalOpen(true);
  };

  const confirmedDelete = () => {
    setIsModalOpen(false);
    deleteMutation.mutate();
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <IsAuth fallback={<ErrorMessage error={"Not Found."} />}>
      <IsAuthor
        userId={postData?.author.id || ""}
        fallback={
          <ErrorMessage error={"Nice try, but this isn’t your playground!"} />
        }
      >
        {form.getValues("slug") && isAuthor && (
          <PostForm
            key={postData?.id}
            form={form}
            onSubmit={onSubmit}
            isCreate={false}
            isPending={updatePostMutation.isPending}
            onDelete={onDelete}
          />
        )}
      </IsAuthor>

      {isModalOpen && (
        <ConfirmDeleteModal
          message="Are you sure?"
          isOpen={isModalOpen}
          onOpenChange={() => setIsModalOpen(false)}
          onConfirm={confirmedDelete}
        />
      )}
    </IsAuth>
  );
};

export default EditPage;
