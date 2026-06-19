"use client";

import { apiClient } from "@/shared/api/api-client";
import { CommentResponse } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { IsAuthor } from "@/features/auth/guards/is-author";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import CommentFormMono from "@/features/comment/ui/comment-form-mono";
import { formatDate2 } from "@/shared/lib/utils";
import ConfirmDeleteModal from "@/shared/ui/confirmation-modal";
import { MonoMenu, type MonoMenuItem } from "@/shared/ui/mono";

interface IProps {
  comment: CommentResponse;
  postId: string;
}

const nameOf = (u: CommentResponse["user"]) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
  u.userName ||
  "Unknown";

const initOf = (u: CommentResponse["user"]) =>
  (u.firstName?.[0] || u.userName?.[0] || "•").toUpperCase();

const CommentMono = ({ comment, postId }: IProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditComment, setIsEditComment] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = useMutation({
    mutationFn: () =>
      apiClient.comments.deleteComment({
        id: comment.id,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getCommentsByPostId", postId],
      });

      addToastSuccess("Comment has been deleted");
    },

    onError: () => {
      addToastError("Error deleting comment");
    },
  });

  const handleConfirmDelete = () => {
    setIsModalOpen(false);
    handleDelete.mutate();
  };

  const handle = comment.user.userName ?? "";

  const menuItems: MonoMenuItem[] = [
    {
      id: "edit",
      label: "Редактировать",
      icon: <PencilSquareIcon className="size-3.5" />,
      onSelect: () => setIsEditComment(true),
    },
    {
      id: "delete",
      label: "Удалить",
      icon: <TrashIcon className="size-3.5" />,
      danger: true,
      onSelect: () => setIsModalOpen(true),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3.5">
        {/* Square avatar */}
        <Link
          href={`/${handle}`}
          aria-label={`${nameOf(comment.user)} profile`}
          className="flex-none"
        >
          {comment.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comment.user.avatarUrl}
              alt={nameOf(comment.user)}
              className="size-10 border-2 border-[var(--m-dim)] object-cover [filter:contrast(1.03)]"
            />
          ) : (
            <span className="font-display flex size-10 items-center justify-center border-2 border-[var(--m-dim)] text-base font-bold text-[var(--m-accent)]">
              {initOf(comment.user)}
            </span>
          )}
        </Link>

        <div className="min-w-0">
          <Link
            href={`/${handle}`}
            className="font-display block text-[14px] leading-[1.2] font-semibold hover:text-[var(--m-accent)]"
          >
            {nameOf(comment.user)}
          </Link>
          <div className="mt-0.5 flex items-center gap-2 text-[12px] whitespace-nowrap">
            <span className="text-[var(--m-accent)]">@{handle}</span>
            <span aria-hidden className="text-[var(--m-muted2)]">
              ·
            </span>
            <span className="text-[var(--m-muted2)] tabular-nums">
              {formatDate2(comment.createdAtUtc)}
            </span>
          </div>
        </div>

        <IsAuthor userId={comment.user.id || ""}>
          <div className="ml-auto">
            <MonoMenu items={menuItems} triggerLabel="Comment options" />
          </div>
        </IsAuthor>
      </div>

      {isEditComment ? (
        <div className="mt-6">
          <CommentFormMono
            postId={postId}
            editComment={comment}
            setIsEditComment={setIsEditComment}
          />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-3">
          <span className="text-[14px] leading-[1.75] font-bold text-[var(--m-accent)]">
            &gt;
          </span>
          <p className="text-[14px] leading-[1.75] whitespace-pre-line text-[var(--m-fg)]">
            {comment.body}
          </p>
        </div>
      )}

      <ConfirmDeleteModal
        message="Are you sure?"
        isOpen={isModalOpen}
        onOpenChange={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CommentMono;
