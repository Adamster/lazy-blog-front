/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/api/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAuth } from "@/providers/auth-provider";
import { Loading } from "@/components/loading";
import { addToastError, addToastSuccess } from "@/utils/toasts";
import { useParams, useRouter } from "next/navigation";
import { UpdatePostOperationRequest, UpdatePostRequest } from "@/api/apis";
import { PostForm } from "@/components/posts/post-form";
import ConfirmDeleteModal from "@/components/modals/confirmation-modal";
import { ErrorMessage } from "@/components/errors/error-message";
import IsAuthor from "@/guards/is-author";

const PageEditClient = () => {
  const { user } = useAuth();
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
      console.log(error);
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
      console.log(error);
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
    <>
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
    </>
  );
};

export default PageEditClient;
