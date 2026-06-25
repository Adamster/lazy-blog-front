"use client";

import { CommentResponse } from "@/shared/api/openapi";
import { useUser } from "@/entities/session";
import { useAddComment } from "@/features/comment/model/use-add-comment";
import { useUpdateComment } from "@/features/comment/model/use-update-comment";
import { IconSubmitButton } from "@/shared/ui";
import { useCallback, useState } from "react";
import {
  CommentEditor,
  type CommentEditorApi,
} from "@/features/comment/ui/comment-editor-wrapper";
import { CommentToolbar } from "@/features/comment/ui/comment-toolbar";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface IProps {
  postId?: string;
  editComment?: CommentResponse;
  setIsEditComment?: (param: boolean) => void;
}

function CommentForm({ postId, editComment, setIsEditComment }: IProps) {
  // `body` mirrors the editor's markdown (debounced) — it drives the empty
  // guard + is the submit payload. The editor OWNS the document; we never push
  // `body` back in (that would fight the cursor) — we remount to reset instead.
  const [body, setBody] = useState(editComment?.body ?? "");
  const [api, setApi] = useState<CommentEditorApi | null>(null);
  // Bumped after a successful add to remount the editor empty (the editor is
  // mount-once / owns its doc, so a remount is the clean reset).
  const [editorKey, setEditorKey] = useState(0);
  const [focused, setFocused] = useState(false);
  const { user } = useUser();

  const addComment = useAddComment(postId ?? "", user);
  const updateComment = useUpdateComment(postId ?? "", user?.id ?? "");

  const onReady = useCallback((next: CommentEditorApi) => setApi(next), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    if (editComment) {
      updateComment.mutate({ commentId: editComment.id, body: trimmed });
      setIsEditComment?.(false);
    } else {
      addComment.mutate(trimmed);
      setBody("");
      setApi(null);
      setEditorKey((k) => k + 1); // remount empty
    }
  };

  const handleCancel = () => {
    if (editComment && setIsEditComment) {
      setIsEditComment(false);
    } else {
      setBody("");
      setApi(null);
      setEditorKey((k) => k + 1);
    }
  };

  const isPending = updateComment.isPending || addComment.isPending;
  const floated = focused || body.length > 0;
  const labelText = editComment ? "Edit comment" : "Add a comment";

  return (
    <form onSubmit={handleSubmit}>
      {/* Material-style floating label — sits over the editor as a prompt, floats
          up on focus/fill. Mirrors the auth/composer floating-label feel. */}
      <div className="relative">
        <span
          className={`pointer-events-none absolute left-0 z-10 text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-all duration-150 ${
            floated ? "top-0" : "top-5"
          }`}
        >
          {labelText}
        </span>

        {/* The editor sits on a 2px bottom rule (the underline-field look),
            turning accent on focus — same affordance as the old textarea. */}
        <div
          className={`border-b-2 pt-5 pb-2 transition-colors ${
            focused ? "border-[var(--m-accent)]" : "border-[var(--m-dim)]"
          }`}
          // Milkdown's editable is the focus target; track focus on the wrapper
          // so the label floats + the underline lights (capture phase = inside).
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <CommentEditor
            key={editorKey}
            markdown={editComment?.body ?? ""}
            onChange={setBody}
            onReady={onReady}
            ariaLabel={labelText}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <CommentToolbar api={api} />

        {editComment && (
          <button
            type="button"
            onClick={handleCancel}
            className={`mono-btn-outline ml-auto inline-flex h-9 items-center px-4 text-[14px] font-semibold tracking-[0.06em] ${focusRing}`}
          >
            Cancel
          </button>
        )}

        <IconSubmitButton
          label={editComment ? "Update" : "Send"}
          pending={isPending}
          disabled={!body.trim()}
          className={editComment ? "" : "ml-auto"}
        />
      </div>
    </form>
  );
}

export default CommentForm;
