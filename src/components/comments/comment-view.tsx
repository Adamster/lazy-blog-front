/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommentResponse } from "@/api/apis";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { Button, Divider, User } from "@heroui/react";
import { PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatDate2 } from "@/utils/format-date";
import { QueryObserverResult, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/api-client";
import { addToastError, addToastSuccess } from "@/helpers/toasts";
import IsAuthor from "@/guards/is-author";
import { useState } from "react";
import ConfirmDeleteModal from "../modals/confirmation-modal";
import CommentForm from "./comment-form";
import Link from "next/link";

interface IProps {
  comment: CommentResponse;
  postCommentsRefetch: () => Promise<
    QueryObserverResult<CommentResponse[], Error>
  >;
}

const Comment = ({ comment, postCommentsRefetch }: IProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditComment, setIsEditComment] = useState(false);

  const handleDelete = useMutation({
    mutationFn: () =>
      apiClient.comments.deleteComment({
        id: comment.id,
      }),

    onSuccess: () => {
      postCommentsRefetch().then(() => {});
      addToastSuccess("Comment has been deleted");
    },

    onError: (error: any) => {
      console.log(error);
      addToastError("Error deleting comment");
    },
  });

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    closeModal();
    handleDelete.mutate();
  };

  return (
    <div>
      <div className="">
        <div className="mb-4 flex flex-row justify-between gap-4 items-end">
          <Link href={`/${comment.user.userName}`}>
            <User
              key={comment.user.id}
              avatarProps={{
                size: "sm",
                src: comment.user.avatarUrl || undefined,
                name: `${comment.user.firstName?.charAt(
                  0
                )}${comment.user.lastName?.charAt(0)}`,
              }}
              name={`${comment.user.firstName} ${comment.user.lastName}`}
              description={"@" + comment.user.userName}
            />
          </Link>

          <div className="flex flex-row items-center gap-3 text-zinc-500">
            <IsAuthor userId={comment.user.id || ""}>
              <>
                <Button
                  variant="light"
                  size="sm"
                  isIconOnly
                  className="h-5 w-5 min-w-5"
                  onPress={() => setIsEditComment((prev) => !prev)}
                >
                  {isEditComment ? (
                    <XMarkIcon className="w-3 h-3"></XMarkIcon>
                  ) : (
                    <PencilIcon className="w-3 h-3" />
                  )}
                </Button>

                <Button
                  variant="light"
                  size="sm"
                  isIconOnly
                  className="h-5 w-5 min-w-5"
                  onPress={openModal}
                >
                  <TrashIcon className="w-3 h-3" />
                </Button>
              </>
            </IsAuthor>

            <span className="text-tiny flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {formatDate2(comment.createdAtUtc)}
            </span>
          </div>
        </div>

        {isEditComment ? (
          <CommentForm
            postCommentsRefetch={postCommentsRefetch}
            editComment={comment}
            setIsEditComment={setIsEditComment}
          />
        ) : (
          <div style={{ whiteSpace: "pre-line" }}>{comment.body}</div>
        )}
      </div>

      <Divider className="layout-page-divider my-8" />

      <ConfirmDeleteModal
        message="Are you sure?"
        isOpen={isModalOpen}
        onOpenChange={closeModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default Comment;
