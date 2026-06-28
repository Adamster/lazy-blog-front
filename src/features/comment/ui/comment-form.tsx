"use client";

import { CommentResponse } from "@/shared/api/openapi";
import { useUser } from "@/entities/session";
import { useAddComment } from "@/features/comment/model/use-add-comment";
import { useUpdateComment } from "@/features/comment/model/use-update-comment";
import { IconSubmitButton, Button } from "@/shared/ui";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useCallback, useState } from "react";
import {
  CommentEditor,
  type CommentEditorApi,
} from "@/features/comment/ui/comment-editor-wrapper";
import { CommentToolbar } from "@/features/comment/ui/comment-toolbar";

interface IProps {
  postId?: string;
  editComment?: CommentResponse;
  setIsEditComment?: (param: boolean) => void;
}

function CommentForm({ postId, editComment, setIsEditComment }: IProps) {
  // The editor OWNS the doc; never push `body` back in (it would fight the cursor) — remount to reset instead.
  const [body, setBody] = useState(editComment?.body ?? "");
  const [api, setApi] = useState<CommentEditorApi | null>(null);
  // Bumped to remount the mount-once editor empty — the clean reset.
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
      setEditorKey((k) => k + 1);
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
      <div className="relative">
        <span
          className={`pointer-events-none absolute left-0 z-[var(--m-z-content)] text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-all duration-150 ${
            floated ? "top-0" : "top-5"
          }`}
        >
          {labelText}
        </span>

        <div
          className={`border-b-2 pt-5 pb-2 transition-colors ${
            focused ? "border-[var(--m-accent)]" : "border-[var(--m-dim)]"
          }`}
          // Milkdown's editable is the real focus target — track focus on the wrapper (capture phase = inside).
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
          <Button variant="outline" onClick={handleCancel} className="ml-auto">
            Cancel
          </Button>
        )}

        <IconSubmitButton
          icon={PaperAirplaneIcon}
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
