/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/api/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAuth } from "@/providers/auth-provider";
import { Loading } from "@/components/loading";
import { addToastError, addToastSuccess } from "@/helpers/toasts";
import { useParams, useRouter } from "next/navigation";
import { UpdatePostOperationRequest, UpdatePostRequest } from "@/api/apis";
import { PostForm } from "@/components/posts/post-form";
import ConfirmDeleteModal from "@/components/modals/confirmation-modal";

const PageEditClient = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slugParam = params?.post as string;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: postData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["getPostsBySlug", slugParam],
    queryFn: () => apiClient.posts.getPostsBySlug({ slug: slugParam }),
    enabled: !!slugParam,
  });

  const isAuthor = user?.id === postData?.author.id;

  const form = useForm<UpdatePostRequest>({
    defaultValues: {
      title: "",
      summary: "",
      slug: "",
      body: "",
      coverUrl: "",
      isPublished: true,
      tags: [],
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (user && postData && !isAuthor) {
      router.push("/");
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
        tags: postData.tags || [],
        isPublished: true,
      });
    }
  }, [postData, form]);

  const editMutation = useMutation({
    mutationFn: ({ id, updatePostRequest }: UpdatePostOperationRequest) =>
      apiClient.posts.updatePost({
        id,
        updatePostRequest,
      }),
    onSuccess: () => {
      addToastSuccess("Post has been updated");
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

  if (isLoading || !isAuthor) return <Loading />;

  if (error) {
    console.error("Error fetching post", error);
    return <div>Error</div>;
  }

  return (
    <>
      <PostForm
        form={form}
        onSubmit={onSubmit}
        create={false}
        onDelete={onDelete}
      />

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
