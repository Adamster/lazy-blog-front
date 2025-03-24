/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { apiClient } from "@/api/api-client";
import { CommentResponse } from "@/api/apis";
import { addToastError, addToastSuccess } from "@/components/toasts/toasts";
import { useTheme } from "@/providers/theme-providers";
import { useUser } from "@/providers/user-provider";
import { FaceSmileIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { Button, Textarea } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EmojiStyle, Theme } from "emoji-picker-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Picker = dynamic(
  () => {
    return import("emoji-picker-react");
  },
  { ssr: false }
);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowEmoji(false);
      }
    }

    if (showEmoji) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji]);

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
      <Textarea
        classNames={{ input: "text-base" }}
        label="Too lazy to add a comment?"
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="input w-full"
        size="md"
      />

      {showEmoji && (
        <div className="relative">
          <div
            ref={pickerRef}
            className="absolute bottom-full right-0 mb-2 z-50"
          >
            <Picker
              theme={isDarkTheme ? Theme.DARK : Theme.LIGHT}
              onEmojiClick={(e) => {
                setBody((prevBody) => prevBody + e.emoji);
                setShowEmoji(false);
              }}
              autoFocusSearch={false}
              emojiStyle={EmojiStyle.APPLE}
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
      )}

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
