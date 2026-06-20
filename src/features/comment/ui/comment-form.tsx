"use client";

import { CommentResponse } from "@/shared/api/openapi";
import { useUser } from "@/entities/session";
import { useAddComment } from "@/features/comment/model/use-add-comment";
import { useUpdateComment } from "@/features/comment/model/use-update-comment";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useClickOutside } from "react-haiku";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

// Curated set of common emojis — native unicode (rendered by the OS, always
// crisp, zero deps/CDN). Just the essentials, not the whole Unicode catalogue.
const EMOJIS = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😅",
  "😊",
  "🙂",
  "😉",
  "😍",
  "😘",
  "😎",
  "🤔",
  "😐",
  "🙄",
  "😴",
  "🥳",
  "😢",
  "😭",
  "😡",
  "🤯",
  "😱",
  "🤗",
  "🫠",
  "💀",
  "👀",
  "🔥",
  "✨",
  "⭐",
  "❤️",
  "💯",
  "🎉",
  "✅",
  "👍",
  "👎",
  "👏",
  "🙏",
  "🙌",
  "💪",
  "👋",
  "🚀",
];

interface IProps {
  postId?: string;
  editComment?: CommentResponse;
  setIsEditComment?: (param: boolean) => void;
}

function CommentForm({ postId, editComment, setIsEditComment }: IProps) {
  const [body, setBody] = useState(editComment?.body || "");
  const [showEmoji, setShowEmoji] = useState(false);
  const [focused, setFocused] = useState(false);
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

  const insertEmoji = (emoji: string) => {
    setBody((prev) => prev + emoji);
    setShowEmoji(false);
    taRef.current?.focus();
  };

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
              className="absolute bottom-full left-0 z-50 mb-2 w-72 border-2 border-[var(--m-dim)] bg-[var(--m-dim)]"
            >
              {/* Faint brutalist grid — the outer border AND the 2px gap rules
                  are both `--m-dim` (cells `--m-card`), so the whole thing reads
                  subtly, edge to edge. */}
              <div className="grid grid-cols-8 gap-[2px]">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`Insert ${emoji}`}
                    onClick={() => insertEmoji(emoji)}
                    className={`flex aspect-square items-center justify-center bg-[var(--m-card)] text-[20px] leading-none transition-colors hover:bg-[var(--m-panel)] ${focusRing}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
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

export default CommentForm;
