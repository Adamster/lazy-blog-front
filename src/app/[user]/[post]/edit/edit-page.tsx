"use client";

import { PostDetailedResponse, UpdatePostRequest } from "@/shared/api/openapi";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import ConfirmDeleteModal from "@/shared/ui/confirmation-modal";
import { PostForm } from "@/features/post/ui/post-form";
import { IsAuthor, ProtectedRoute } from "@/entities/session";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUpdatePost } from "@/features/post/model/use-update-post";
import { usePostBySlug } from "@/features/post/model/use-post-by-slug";
import { useDeletePost } from "@/features/post/model/use-delete-post";

const EditPage = () => {
  const params = useParams();
  const slug = params?.post as string;

  const { data: postData, error, isLoading } = usePostBySlug(slug);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  if (!postData) return <ErrorMessage error={"Not Found."} />;

  return (
    <ProtectedRoute>
      <div
        className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <IsAuthor
          userId={postData.author.id || ""}
          loadingFallback={<Loading />}
          fallback={
            <ErrorMessage error={"Nice try, but this isn’t your playground!"} />
          }
        >
          {/* Mounted only here, with `postData` guaranteed present, so the form
              (and the mount-once Crepe editor inside it) seeds `defaultValues`
              from the loaded post on its FIRST render — no effect-vs-mount race. */}
          <EditForm postData={postData} />
        </IsAuthor>
      </div>
    </ProtectedRoute>
  );
};

/**
 * The edit composer, mounted only once `postData` is loaded. It initialises the
 * react-hook-form instance with `defaultValues` straight from `postData` (the
 * same seeding pattern as `create-page`), so the editor reads the real body on
 * mount instead of resetting into it via an effect after Crepe has already
 * captured an empty value.
 */
const EditForm = ({ postData }: { postData: PostDetailedResponse }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<UpdatePostRequest>({
    mode: "onChange",
    defaultValues: {
      title: postData.title,
      summary: postData.summary || undefined,
      slug: postData.slug,
      body: postData.body,
      coverUrl: postData.coverUrl || undefined,
      tags: postData.tags.map((tag) => tag.tagId),
      isPublished: postData.isPublished,
    },
  });

  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();

  const onSubmit = form.handleSubmit((data) => {
    updatePostMutation.mutate({
      id: postData.id,
      updatePostRequest: data,
    });
  });

  const confirmedDelete = () => {
    setIsModalOpen(false);
    deletePostMutation.mutate(postData.id);
  };

  return (
    <>
      <PostForm
        form={form}
        onSubmit={onSubmit}
        isPending={updatePostMutation.isPending}
        onDelete={() => setIsModalOpen(true)}
        viewHref={`/${postData.author.userName}/${postData.slug}`}
      />

      {isModalOpen && (
        <ConfirmDeleteModal
          title="Delete post?"
          description="This post and all its comments will be permanently removed. This can't be undone."
          confirmLabel="Delete post"
          isOpen={isModalOpen}
          onOpenChange={() => setIsModalOpen(false)}
          onConfirm={confirmedDelete}
        />
      )}
    </>
  );
};

export default EditPage;
