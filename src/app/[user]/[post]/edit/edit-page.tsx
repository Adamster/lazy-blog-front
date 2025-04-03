/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { UpdatePostRequest } from "@/shared/api/openapi";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import ConfirmDeleteModal from "@/shared/ui/confirmation-modal";
import { PostForm } from "@/features/post/ui/post-form";
import { IsAuthor } from "@/features/auth/guards/is-author";
import { useUser } from "@/shared/providers/user-provider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IsAuth } from "@/features/auth/guards/is-auth";
import { useUpdatePost } from "@/features/post/model/use-update-post";
import { usePostBySlug } from "@/features/post/model/use-post-by-slug";
import { useDeletePost } from "@/features/post/model/use-delete-post";

const EditPage = () => {
  const params = useParams();
  const slug = params?.post as string;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: postData, error, isLoading } = usePostBySlug(slug);
  const { user } = useUser();
  const deletePostMutation = useDeletePost();

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
  }, [postData?.id]);

  const updatePostMutation = useUpdatePost();

  const onSubmit = form.handleSubmit((data) => {
    updatePostMutation.mutate({
      id: postData?.id ?? "",
      updatePostRequest: data,
    });
  });

  const onDelete = () => {
    setIsModalOpen(true);
  };

  const confirmedDelete = () => {
    setIsModalOpen(false);
    deletePostMutation.mutate(postData?.id || "");
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
        {form && isAuthor && (
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
