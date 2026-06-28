"use client";

import { CommentResponse } from "@/shared/api/openapi";
import { IsAuth } from "@/entities/session";
import { Label } from "@/shared/ui";
import { MatrixText } from "@/shared/ui/effects";
import CommentView from "./comment-view";
import CommentForm from "@/features/comment/ui/comment-form";

interface IProps {
  postId: string;
  postComments: CommentResponse[] | undefined;
  postCommentsLoading: boolean;
  isPostPublished: boolean;
}

export function CommentsSection({
  postId,
  postComments,
  postCommentsLoading,
  isPostPublished,
}: IProps) {
  const count = postComments?.length ?? 0;

  return (
    <section>
      {isPostPublished && (
        <IsAuth>
          <div className="pt-10">
            <CommentForm postId={postId} />
          </div>
        </IsAuth>
      )}

      {postCommentsLoading ? (
        <div className="flex flex-col gap-7 pt-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-[40px_1fr] gap-4">
              <div className="size-10 border-2 border-[var(--m-dim)] bg-[var(--m-panel)]" />
              <div className="space-y-2">
                <div className="h-3 w-40 bg-[var(--m-panel)]" />
                <div className="h-3 w-full bg-[var(--m-panel)]" />
                <div className="h-3 w-3/4 bg-[var(--m-panel)]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* When empty the scramble IS the content, so it's a terminal section (py-10) rather than hugging a list. */}
          <Label className={`mono-label ${count > 0 ? "pt-10 pb-6" : "py-10"}`}>
            {count > 0 ? (
              `${count} COMMENTS`
            ) : (
              <MatrixText text="SIGNAL SENT ... NO REPLY YET" />
            )}
          </Label>
          {count > 0 && (
            <div className="flex flex-col gap-7">
              {postComments?.map((comment: CommentResponse) => (
                <CommentView
                  postId={postId}
                  key={comment.id}
                  comment={comment}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
