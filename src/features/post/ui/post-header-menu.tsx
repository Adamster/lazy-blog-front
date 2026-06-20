"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PencilSquareIcon,
  EyeSlashIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Menu, type MenuItem } from "@/shared/ui";
import ConfirmDeleteModal from "@/shared/ui/confirmation-modal";
import { usePublishPost, useHidePost } from "../model/use-publish-post";
import { useDeletePostMenu } from "../model/use-delete-post-menu";

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
  const [confirmOpen, setConfirmOpen] = useState(false);

  const publishPost = usePublishPost(postId, postSlug, authorHandle);
  const hidePost = useHidePost(postId, postSlug, authorHandle);
  // Local delete (optimistic remove-from-feed → home), distinct from the shared
  // `useDeletePost` used by the edit page (routes to the author profile).
  const deletePost = useDeletePostMenu(postId);

  const iconCls = "size-3.5";

  const items: MenuItem[] = [
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
      <Menu items={items} triggerLabel="Post options" />
      <ConfirmDeleteModal
        title="Delete post?"
        description="This post and all its comments will be permanently removed. This can't be undone."
        confirmLabel="Delete post"
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
