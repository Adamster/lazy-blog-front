/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from "@/shared/api/api-client";
import { CommentResponse } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useTheme } from "@/shared/providers/theme-providers";
import { useUser } from "@/shared/providers/user-provider";
import { FaceSmileIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { Button, cn, Textarea } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EmojiStyle, Theme } from "emoji-picker-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useClickOutside } from "react-haiku";

const Picker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
});

interface IProps {
  postId?: string;
  editComment?: CommentResponse;
  setIsEditComment?: (param: boolean) => void;
}

function CommentForm({ postId, editComment, setIsEditComment }: IProps) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState(editComment?.body || "");
  const [showEmoji, setShowEmoji] = useState(false);
  const { isDarkTheme } = useTheme();
  const { user } = useUser();
  const pickerRef = useRef<HTMLDivElement>(null);

  useClickOutside(pickerRef, () => {
    setShowEmoji(false);
  });

  const postComment = useMutation({
    mutationFn: () =>
      apiClient.comments.addComment({
        addCommentRequest: { postId: postId!, userId: user!.id!, body },
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getCommentsByPostId", postId],
      });

      addToastSuccess("Comment has been posted");
    },

    onError: () => {
      addToastError("Error posting comment");
    },

    onSettled: () => {
      setBody("");
      setShowEmoji(false);
    },
  });

  const postEditedComment = useMutation({
    mutationFn: () =>
      apiClient.comments.updateComment({
        updateCommentRequest: {
          userId: user ? user.id! : "",
          body: body,
          commentId: editComment ? editComment.id : "",
        },
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getCommentsByPostId", postId],
      });

      addToastSuccess("Comment has been updated");
    },

    onError: () => {
      addToastError("Error updating comment");
    },

    onSettled: () => {
      setBody("");
      setShowEmoji(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    if (editComment) {
      e.preventDefault();
      postEditedComment.mutate();

      if (setIsEditComment) setIsEditComment(false);
    } else {
      e.preventDefault();
      postComment.mutate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <Textarea
          classNames={{ input: "text-base" }}
          label="Too lazy to add a comment?"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="input w-full"
          size="md"
        />

        <div
          ref={pickerRef}
          className={cn(
            "absolute right-0 bottom-0 z-50",
            showEmoji ? "" : "hidden"
          )}
        >
          <Picker
            theme={isDarkTheme ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={(e) => {
              setBody((prevBody) => prevBody + e.emoji);
              setShowEmoji(false);
            }}
            autoFocusSearch={false}
            emojiStyle={EmojiStyle.NATIVE}
            searchDisabled
            height={300}
            width={400}
            skinTonesDisabled
            previewConfig={{
              showPreview: false,
            }}
          />
        </div>
      </div>

      <div className="flex gap-4 items-center justify-end">
        <Button
          variant="flat"
          size="sm"
          isIconOnly
          onPress={() => {
            setShowEmoji((state) => !state);
          }}
        >
          <FaceSmileIcon width="1rem" height="1.5rem" />
        </Button>

        <Button
          type="submit"
          variant="flat"
          color="primary"
          size="sm"
          isIconOnly
          disabled={postEditedComment.isPending || postComment.isPending}
          isLoading={postEditedComment.isPending || postComment.isPending}
        >
          {!(postEditedComment.isPending || postComment.isPending) && (
            <PaperAirplaneIcon
              color="color-primary"
              width="1rem"
              height="1.5rem"
            />
          )}
        </Button>
      </div>
    </form>
  );
}

export default CommentForm;
