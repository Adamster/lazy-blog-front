"use client";

import { CommentResponse } from "@/shared/api/openapi";
import { IsAuth } from "@/features/auth/guards/is-auth";
import { Label, MatrixText } from "@/shared/ui";
import CommentMono from "./rewrite-comment-view";
import CommentFormMono from "@/features/comment/ui/rewrite-comment-form";

interface IProps {
  postId: string;
  postComments: CommentResponse[] | undefined;
  postCommentsLoading: boolean;
  isPostPublished: boolean;
}

export function CommentsMono({
  postId,
  postComments,
  postCommentsLoading,
  isPostPublished,
}: IProps) {
  const count = postComments?.length ?? 0;

  return (
    <section>
      {/* Compose — straight to add comment (no header/line).
          40px section rhythm: each block sits 40px from the band/each other. */}
      {isPostPublished && (
        <IsAuth>
          <div className="pt-10">
            <CommentFormMono postId={postId} />
          </div>
        </IsAuth>
      )}

      {postCommentsLoading ? (
        <div className="flex flex-col pt-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="grid grid-cols-[40px_1fr] gap-4 border-b-2 border-[var(--m-dim)] py-6"
            >
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
          <Label className="mono-label py-10">
            {count > 0 ? (
              `${count} COMMENTS`
            ) : (
              <MatrixText text="SIGNAL SENT ... NO REPLY YET" />
            )}
          </Label>
          {count > 0 && (
            <div className="flex flex-col gap-7">
              {postComments?.map((comment: CommentResponse) => (
                <CommentMono
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
