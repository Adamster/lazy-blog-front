"use client";

import { apiClient } from "@/shared/api/api-client";
import { CommentResponse } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useTheme } from "@/shared/providers/theme-providers";
import { useUser } from "@/shared/providers/user-provider";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { cn } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EmojiStyle, Theme } from "emoji-picker-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useClickOutside } from "react-haiku";

const Picker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
});

// emoji-picker-react sets its CSS variables on a hashed Flairup class injected
// into a runtime <style>, so a stylesheet override loses the cascade. Setting
// them inline on the root (via the `style` prop) wins — square corners, 2px
// branding frame, and the mono palette (tokens resolve inside `.mono-scope`).
const EMOJI_PICKER_STYLE = {
  "--epr-picker-border-radius": "0px",
  "--epr-picker-border-color": "var(--m-line)",
  "--epr-bg-color": "var(--m-card)",
  "--epr-category-label-bg-color": "var(--m-card)",
  "--epr-hover-bg-color": "var(--m-panel)",
  "--epr-focus-bg-color": "var(--m-panel)",
  "--epr-text-color": "var(--m-fg)",
  border: "2px solid var(--m-line)",
  borderRadius: 0,
} as React.CSSProperties;

interface IProps {
  postId?: string;
  editComment?: CommentResponse;
  setIsEditComment?: (param: boolean) => void;
}

function CommentFormMono({ postId, editComment, setIsEditComment }: IProps) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState(editComment?.body || "");
  const [showEmoji, setShowEmoji] = useState(false);
  const [focused, setFocused] = useState(false);
  const { isDarkTheme } = useTheme();
  const { user } = useUser();
  const pickerRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useClickOutside(pickerRef, () => {
    setShowEmoji(false);
  });

  // Auto-grow the single-row textarea to fit its content (and shrink back when
  // cleared after submit), per the design's compose field.
  useEffect(() => {
    const t = taRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight}px`;
  }, [body]);

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

  const handleCancel = () => {
    if (editComment && setIsEditComment) {
      setIsEditComment(false);
    } else {
      setBody("");
    }
    setShowEmoji(false);
  };

  const isPending = postEditedComment.isPending || postComment.isPending;

  const floated = focused || body.length > 0;
  const labelText = editComment ? "Edit comment" : "Add a comment";

  return (
    <form onSubmit={handleSubmit}>
      {/* Material-style floating label — sits as placeholder, floats up on
          focus/fill. (Field labels everywhere will move to this pattern.) */}
      <div className="relative">
        <label
          htmlFor="mono-comment-input"
          className={`pointer-events-none absolute left-0 text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-all duration-150 ${
            floated ? "top-0" : "top-5"
          }`}
        >
          {labelText}
        </label>
        <textarea
          id="mono-comment-input"
          ref={taRef}
          required
          rows={1}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={labelText}
          className="block w-full resize-none overflow-hidden border-0 border-b-2 border-[var(--m-accent)] bg-transparent px-0 pt-5 pb-2 text-[14px] leading-[1.6] text-[var(--m-fg)] caret-[var(--m-accent)] outline-none"
          style={{ fontFamily: "var(--font-mono)" }}
        />
      </div>

      <div className="mt-[18px] flex items-center gap-3">
        {/* Emoji button + popover, anchored to the button (opens upward-left) */}
        <div ref={pickerRef} className="relative">
          <button
            type="button"
            aria-label="Insert emoji"
            onClick={() => setShowEmoji((state) => !state)}
            className="mono-icon-btn size-9"
          >
            <FaceSmileIcon className="size-[18px] shrink-0" />
          </button>

          <div
            className={cn(
              "absolute bottom-full left-0 z-50 mb-2",
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
              width={360}
              skinTonesDisabled
              previewConfig={{
                showPreview: false,
              }}
              style={EMOJI_PICKER_STYLE}
            />
          </div>
        </div>

        {editComment && (
          <button
            type="button"
            onClick={handleCancel}
            className="mono-btn-outline ml-auto inline-flex h-9 items-center px-4 text-[14px] font-semibold tracking-[0.06em]"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "mono-cta inline-flex h-9 items-center px-4 text-[14px] font-bold tracking-[0.06em]",
            editComment ? "" : "ml-auto"
          )}
        >
          {isPending ? "Sending" : editComment ? "Update" : "Send"}
        </button>
      </div>
    </form>
  );
}

export default CommentFormMono;
