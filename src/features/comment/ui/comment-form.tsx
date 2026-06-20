"use client";

import { CommentResponse } from "@/shared/api/openapi";
import { useTheme } from "@/shared/providers/theme-providers";
import { useUser } from "@/shared/providers/user-provider";
import { useAddComment } from "@/features/comment/model/use-add-comment";
import { useUpdateComment } from "@/features/comment/model/use-update-comment";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { EmojiStyle, Theme } from "emoji-picker-react";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useClickOutside } from "react-haiku";

const Picker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
});

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

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
  const [body, setBody] = useState(editComment?.body || "");
  const [showEmoji, setShowEmoji] = useState(false);
  const [focused, setFocused] = useState(false);
  const { isDarkTheme } = useTheme();
  const { user } = useUser();
  const pickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const addComment = useAddComment(postId ?? "", user);
  const updateComment = useUpdateComment(postId ?? "", user?.id ?? "");

  const closeEmoji = useCallback(() => setShowEmoji(false), []);
  useClickOutside(pickerRef, closeEmoji);

  // Auto-grow the single-row textarea to fit its content (and shrink back when
  // cleared after submit). `useLayoutEffect` runs before paint so the height is
  // correct on first frame — no visible jump. `field-sizing: content` (set
  // inline below) makes this native where supported; this stays the fallback.
  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [body]);

  // Close the emoji popover on Escape and return focus to its trigger.
  useEffect(() => {
    if (!showEmoji) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEmoji(false);
        emojiButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showEmoji]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    if (editComment) {
      updateComment.mutate({ commentId: editComment.id, body });
      setIsEditComment?.(false);
    } else {
      addComment.mutate(body);
      setBody("");
    }
    setShowEmoji(false);
  };

  const handleCancel = () => {
    if (editComment && setIsEditComment) {
      setIsEditComment(false);
    } else {
      setBody("");
    }
    setShowEmoji(false);
  };

  const isPending = updateComment.isPending || addComment.isPending;

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
          style={{ fontFamily: "var(--font-mono)", fieldSizing: "content" }}
        />
      </div>

      <div className="mt-[18px] flex items-center gap-3">
        {/* Emoji button + popover, anchored to the button (opens upward-left) */}
        <div ref={pickerRef} className="relative">
          <button
            ref={emojiButtonRef}
            type="button"
            aria-label="Insert emoji"
            aria-haspopup="dialog"
            aria-expanded={showEmoji}
            onClick={() => setShowEmoji((state) => !state)}
            className={`mono-icon-btn size-9 ${focusRing}`}
          >
            <FaceSmileIcon className="size-[18px] shrink-0" />
          </button>

          {showEmoji && (
            <div
              role="dialog"
              aria-label="Emoji picker"
              className="absolute bottom-full left-0 z-50 mb-2"
            >
              <Picker
                theme={isDarkTheme ? Theme.DARK : Theme.LIGHT}
                onEmojiClick={(e) => {
                  setBody((prevBody) => prevBody + e.emoji);
                  setShowEmoji(false);
                  taRef.current?.focus();
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
          )}
        </div>

        {editComment && (
          <button
            type="button"
            onClick={handleCancel}
            className={`mono-btn-outline ml-auto inline-flex h-9 items-center px-4 text-[14px] font-semibold tracking-[0.06em] ${focusRing}`}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={`mono-cta inline-flex h-9 items-center px-4 text-[14px] font-bold tracking-[0.06em] ${focusRing} ${
            editComment ? "" : "ml-auto"
          }`}
        >
          {isPending ? "Sending" : editComment ? "Update" : "Send"}
        </button>
      </div>
    </form>
  );
}

export default CommentFormMono;
