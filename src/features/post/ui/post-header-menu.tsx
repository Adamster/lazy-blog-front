"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PencilSquareIcon,
  EyeSlashIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "@/shared/api/api-client";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { MonoMenu, type MonoMenuItem } from "@/shared/ui/mono";
import ConfirmDeleteModal from "@/shared/ui/confirmation-modal";
import { usePublishPost, useHidePost } from "../model/use-publish-post";

interface IProps {
  postId: string;
  postSlug: string;
  authorHandle: string;
  isPublished: boolean;
}

/**
 * Owner-only kebab in the post title row. Holds Edit (→ edit page),
 * publish/unpublish (depending on `isPublished`), and Delete (→ `/` on success).
 * Render this inside an `IsAuthor` guard.
 */
export const PostHeaderMenu = ({
  postId,
  postSlug,
  authorHandle,
  isPublished,
}: IProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const publishPost = usePublishPost(postId, postSlug);
  const hidePost = useHidePost(postId, postSlug);

  // Local delete — unlike the shared `useDeletePost` (used by the edit page,
  // routes to the author profile), the kebab returns to home per the design.
  const deletePost = useMutation({
    mutationFn: () => apiClient.posts.deletePost({ id: postId }),
    onSuccess: () => {
      addToastSuccess("Post has been deleted");
      queryClient.invalidateQueries({ queryKey: ["getAllPosts"] });
      queryClient.invalidateQueries({ queryKey: ["getPostsByUserName"] });
      router.push("/");
    },
    onError: (error: any) => addToastError("Error deleting post", error),
  });

  const iconCls = "size-3.5";

  const items: MonoMenuItem[] = [
    {
      id: "edit",
      label: "Редактировать",
      icon: <PencilSquareIcon className={iconCls} />,
      onSelect: () => router.push(`/${authorHandle}/${postSlug}/edit`),
    },
    {
      id: "publish",
      label: isPublished ? "Снять с публикации" : "Опубликовать",
      icon: isPublished ? (
        <EyeSlashIcon className={iconCls} />
      ) : (
        <EyeIcon className={iconCls} />
      ),
      onSelect: () => (isPublished ? hidePost.mutate() : publishPost.mutate()),
    },
    {
      id: "delete",
      label: "Удалить",
      icon: <TrashIcon className={iconCls} />,
      danger: true,
      onSelect: () => setConfirmOpen(true),
    },
  ];

  return (
    <>
      <MonoMenu items={items} triggerLabel="Post options" />
      <ConfirmDeleteModal
        message="Are you sure?"
        isOpen={confirmOpen}
        onOpenChange={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          deletePost.mutate();
        }}
      />
    </>
  );
};
