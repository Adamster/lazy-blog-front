/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button, Textarea } from "@heroui/react";
import { FaceSmileIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { EmojiStyle, Theme } from "emoji-picker-react";
import { useTheme } from "@/providers/theme-providers";
import dynamic from "next/dynamic";
import { QueryObserverResult, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/api-client";
import { useAuth } from "@/providers/auth-provider";
import { addToastError, addToastSuccess } from "@/helpers/toasts";
import { CommentResponse } from "@/api/apis";

const Picker = dynamic(
  () => {
    return import("emoji-picker-react");
  },
  { ssr: false }
);

interface IProps {
  postId: string;
  commentsRefetch: () => Promise<QueryObserverResult<CommentResponse[], Error>>;
}

function CommentForm({ postId, commentsRefetch }: IProps) {
  const [body, setBody] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const { isDarkTheme } = useTheme();
  const { user } = useAuth();
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

  const handleSend = useMutation({
    mutationFn: () =>
      apiClient.comments.addComment({
        addCommentRequest: { postId, userId: user!.id!, body },
      }),

    onSuccess: () => {
      commentsRefetch().then(() => {});
      addToastSuccess("Comment has been posted");
    },

    onError: (error: any) => {
      console.log(error);
      addToastError("Error posting comment");
    },

    onSettled: () => {
      setBody("");
      setShowEmoji(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <Textarea
          label="Too lazy to add a comment?"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="input w-full"
          size="md"
        />

        {showEmoji && (
          <div
            ref={pickerRef}
            className="absolute bottom-full right-0 mb-2 z-10"
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
              width={300}
              skinTonesDisabled
              previewConfig={{
                showPreview: false,
              }}
            />
          </div>
        )}
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

        <Button type="submit" variant="flat" size="sm" isIconOnly>
          <PaperAirplaneIcon
            color="color-primary"
            width="1rem"
            height="1.5rem"
          />
        </Button>
      </div>
    </form>
  );
}

export default CommentForm;
