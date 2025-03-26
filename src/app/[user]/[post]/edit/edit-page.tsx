/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { apiClient } from "@/shared/api/api-client";
import {
  UpdatePostOperationRequest,
  UpdatePostRequest,
} from "@/shared/api/openapi";
import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/shared/ui/loading";
import ConfirmDeleteModal from "@/components/modals/confirmation-modal";
import { PostForm } from "@/components/posts/post-form";
import { addToastError, addToastSuccess } from "@/components/toasts/toasts";
import IsAuthor from "@/features/auth/guards/is-author";
import { useUser } from "@/shared/providers/user-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import IsAuth from "@/features/auth/guards/is-auth";

const EditPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const slug = params?.post as string;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: postData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["getPostBySlug", slug],
    queryFn: () => apiClient.posts.getPostBySlug({ slug }),
    enabled: !!slug,
  });

  const isAuthor = user?.id === postData?.author.id;

  const form = useForm<UpdatePostRequest>({
    mode: "onChange",
  });

  useEffect(() => {
    if (user && postData && !isAuthor) {
      setTimeout(() => router.push("/"), 4000);
    }
  }, [user, postData, isAuthor, router]);

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

  const editMutation = useMutation({
    mutationFn: ({ id, updatePostRequest }: UpdatePostOperationRequest) =>
      apiClient.posts.updatePost({
        id,
        updatePostRequest,
      }),
    onSuccess: () => {
      addToastSuccess("Post has been updated");

      queryClient.invalidateQueries({
        queryKey: ["getPostBySlug", postData?.slug],
      });
    },
    onError: (error: any) => {
      addToastError("Error updating post", error);
    },
  });

  const onSubmit = () => {
    const data = form.getValues();

    form.trigger().then((isValid) => {
      if (isValid) {
        editMutation.mutate({
          id: postData?.id ?? "",
          updatePostRequest: data,
        });
      }
    });
  };

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
            create={false}
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
