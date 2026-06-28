"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PencilSquareIcon,
  EyeSlashIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Menu, ConfirmModal, type MenuItem } from "@/shared/ui";
import { usePublishPost, useHidePost } from "../model/use-publish-post";
import { useDeletePostMenu } from "../model/use-delete-post-menu";

interface IProps {
  postId: string;
  postSlug: string;
  authorHandle: string;
  isPublished: boolean;
}

// Owner-only — render inside an `IsAuthor` guard.
export const PostHeaderMenu = ({
  postId,
  postSlug,
  authorHandle,
  isPublished,
}: IProps) => {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const publishPost = usePublishPost(postId, postSlug, authorHandle);
  const hidePost = useHidePost(postId, postSlug, authorHandle);
  // Distinct from the edit page's `useDeletePost` — this one routes to home.
  const deletePost = useDeletePostMenu(postId);

  const iconCls = "size-3.5";

  const items: MenuItem[] = [
    {
      id: "edit",
      label: "Edit",
      icon: <PencilSquareIcon className={iconCls} />,
      onSelect: () => router.push(`/${authorHandle}/${postSlug}/edit`),
    },
    {
      id: "publish",
      label: isPublished ? "Unpublish" : "Publish",
      icon: isPublished ? (
        <EyeSlashIcon className={iconCls} />
      ) : (
        <EyeIcon className={iconCls} />
      ),
      onSelect: () =>
        isPublished ? setUnpublishOpen(true) : setPublishOpen(true),
    },
    {
      id: "delete",
      label: "Delete",
      icon: <TrashIcon className={iconCls} />,
      danger: true,
      onSelect: () => setConfirmOpen(true),
    },
  ];

  return (
    <>
      <Menu items={items} triggerLabel="Post options" />
      <ConfirmModal
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
      <ConfirmModal
        tone="default"
        eyebrow="// Visibility"
        title="Unpublish post?"
        description="It'll be hidden from everyone but you and pulled from feeds. You can republish it anytime."
        confirmLabel="Unpublish"
        isOpen={unpublishOpen}
        onOpenChange={() => setUnpublishOpen(false)}
        onConfirm={() => {
          setUnpublishOpen(false);
          hidePost.mutate();
        }}
      />
      <ConfirmModal
        tone="default"
        eyebrow="// Visibility"
        title="Publish post?"
        description="It'll go live and show up in feeds for everyone. You can unpublish it anytime."
        confirmLabel="Publish"
        isOpen={publishOpen}
        onOpenChange={() => setPublishOpen(false)}
        onConfirm={() => {
          setPublishOpen(false);
          publishPost.mutate();
        }}
      />
    </>
  );
};
