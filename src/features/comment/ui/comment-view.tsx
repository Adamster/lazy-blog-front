"use client";

import { CommentResponse } from "@/shared/api/openapi";
import { IsAuthor } from "@/entities/session";
import { useDeleteComment } from "@/features/comment/model/use-delete-comment";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import CommentForm from "@/features/comment/ui/comment-form";
import { formatDate2 } from "@/shared/lib/utils";
import ConfirmDeleteModal from "@/shared/ui/confirmation-modal";
import { Avatar, Dot, Menu, type MenuItem } from "@/shared/ui";

interface IProps {
  comment: CommentResponse;
  postId: string;
}

const nameOf = (u: CommentResponse["user"]) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
  u.userName ||
  "Unknown";

const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
const EMOJI_RE = /\p{Extended_Pictographic}/u;

/**
 * Render comment text with emoji enlarged (~1.35em). Native emoji otherwise
 * inherit the 14px body size and read tiny; we segment into graphemes (so ZWJ
 * sequences / variation selectors stay intact) and wrap emoji ones in a larger
 * span, leaving the surrounding text at body size. Falls back to plain text
 * where `Intl.Segmenter` is unavailable.
 */
function withBigEmoji(text: string): ReactNode {
  if (!graphemeSegmenter) return text;
  const out: ReactNode[] = [];
  let buf = "";
  let key = 0;
  for (const { segment } of graphemeSegmenter.segment(text)) {
    if (EMOJI_RE.test(segment)) {
      if (buf) {
        out.push(buf);
        buf = "";
      }
      out.push(
        <span key={key++} className="align-[-0.1em] text-[1.35em] leading-none">
          {segment}
        </span>
      );
    } else {
      buf += segment;
    }
  }
  if (buf) out.push(buf);
  return out;
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

  const menuItems: MenuItem[] = [
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
        <Link
          href={`/${handle}`}
          aria-label={`${nameOf(comment.user)} profile`}
          className="flex-none"
        >
          <Avatar src={comment.user.avatarUrl} name={nameOf(comment.user)} />
        </Link>

        <div className="min-w-0">
          <span className="font-display block text-[14px] font-semibold text-[var(--m-muted)]">
            {nameOf(comment.user)}
          </span>
          <div className="mt-0.5 flex items-center gap-2.5 text-[12px] whitespace-nowrap">
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
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-3">
          <span className="text-[14px] leading-[1.6] font-bold text-[var(--m-accent)]">
            &gt;
          </span>
          <p className="text-[14px] leading-[1.6] whitespace-pre-line text-[var(--m-fg)]">
            {withBigEmoji(comment.body)}
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

export default CommentView;
