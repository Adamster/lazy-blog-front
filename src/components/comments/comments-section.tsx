import { CommentResponse } from "@/api/apis";
import IsAuth from "../../guards/is-auth";
import Comment from "./comment-view";
import { Loading } from "../loading";
import { Divider } from "@heroui/react";
import CommentForm from "./comment-form";

interface IProps {
  postId: string;
  postComments: CommentResponse[] | undefined;
  postCommentsLoading: boolean;
  isPostPublished: boolean;
}

export function Comments({
  postId,
  postComments,
  postCommentsLoading,
  isPostPublished,
}: IProps) {
  return (
    <div className="mt-20">
      {isPostPublished && (
        <IsAuth>
          <div className="mb-6">
            <CommentForm postId={postId} />
          </div>
        </IsAuth>
      )}

      {postCommentsLoading && <Loading inline />}

      {postComments?.length ? (
        <div>
          <Divider className="layout-page-divider my-6" />

          <div className="flex flex-col">
            {postComments?.map((comment: CommentResponse) => (
              <Comment postId={postId} key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
