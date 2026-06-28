"use client";

import { CommentResponse } from "@/shared/api/openapi";
import { IsAuthor } from "@/entities/session";
import { useDeleteComment } from "@/features/comment/model/use-delete-comment";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CommentForm from "@/features/comment/ui/comment-form";
import { displayNameOf, formatDate2 } from "@/shared/lib/utils";
import { Avatar, Dot, Menu, ConfirmModal, type MenuItem } from "@/shared/ui";
import { renderCommentMarkdown } from "@/features/comment/lib/comment-markdown";
import {
  canEditComment,
  editWindowRemainingMs,
} from "@/features/comment/lib/comment-edit-window";

interface IProps {
  comment: CommentResponse;
  postId: string;
}

const CommentView = ({ comment, postId }: IProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditComment, setIsEditComment] = useState(false);

  const deleteComment = useDeleteComment(postId, comment.id);

  const handleConfirmDelete = () => {
    setIsModalOpen(false);
    deleteComment.mutate();
  };

  const handle = comment.user.userName ?? "";

  // The author may edit only within the 1-hour window after posting; once it
  // closes the Edit affordance drops. Seed from the helper (no sync setState in
  // an effect) and schedule the exact flip-off so it disappears live, not just
  // on the next refresh. The backend is the authoritative gate.
  const createdAt = comment.createdAtUtc;
  const [canEdit, setCanEdit] = useState(() => canEditComment(createdAt));
  useEffect(() => {
    if (!canEdit) return;
    const timer = setTimeout(
      () => setCanEdit(false),
      editWindowRemainingMs(createdAt)
    );
    return () => clearTimeout(timer);
  }, [canEdit, createdAt]);

  // Render the whole body through the minimal inline-markdown subset — which now
  // also renders inline GIF images (whitelisted KLIPY/Tenor only). This covers
  // both NEW comments (GIFs are `![gif](url)` images anywhere) and OLD ones
  // (trailing `![gif](url)` lines are just images at the end). Memoized on the
  // raw body so re-renders (menu open, edit toggle) don't re-parse.
  const renderedBody = useMemo(
    () => (comment.body.trim() ? renderCommentMarkdown(comment.body) : null),
    [comment.body]
  );

  const menuItems: MenuItem[] = [
    ...(canEdit
      ? [
          {
            id: "edit",
            label: "Edit",
            icon: <PencilSquareIcon className="size-3.5" />,
            onSelect: () => setIsEditComment(true),
          },
        ]
      : []),
    {
      id: "delete",
      label: "Delete",
      icon: <TrashIcon className="size-3.5" />,
      danger: true,
      onSelect: () => setIsModalOpen(true),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-4">
        <Link
          href={`/${handle}`}
          aria-label={`${displayNameOf(comment.user)} profile`}
          className="flex-none"
        >
          <Avatar
            src={comment.user.avatarUrl}
            name={displayNameOf(comment.user)}
          />
        </Link>

        <div className="min-w-0">
          <span className="font-display block text-[14px] font-semibold">
            {displayNameOf(comment.user)}
          </span>
          <div className="mt-1 flex items-center gap-2.5 text-[12px] whitespace-nowrap">
            <Link
              href={`/${handle}`}
              className="text-[var(--m-muted)] transition-colors hover:text-[var(--m-accent)]"
            >
              @{handle}
            </Link>
            <Dot />
            <span className="text-[var(--m-muted)] tabular-nums">
              {formatDate2(comment.createdAtUtc)}
            </span>
          </div>
        </div>

        <IsAuthor userId={comment.user.id || ""}>
          <div className="ml-auto">
            <Menu items={menuItems} triggerLabel="Comment options" />
          </div>
        </IsAuthor>
      </div>

      {isEditComment ? (
        <div className="mt-6">
          <CommentForm
            postId={postId}
            editComment={comment}
            setIsEditComment={setIsEditComment}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-[auto_1fr] gap-3">
          <span className="text-[14px] leading-[1.6] font-bold text-[var(--m-accent)]">
            &gt;
          </span>
          <div className="min-w-0">
            {renderedBody && (
              <p className="text-[14px] leading-[1.6] whitespace-pre-line text-[var(--m-fg)]">
                {renderedBody}
              </p>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        title="Delete comment?"
        description="This comment will be permanently removed. This can't be undone."
        isOpen={isModalOpen}
        onOpenChange={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CommentView;
