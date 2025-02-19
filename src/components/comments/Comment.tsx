import { IComment } from "@/types";
import { formatDate } from "@/utils/format-date";
import classNames from "classnames";
import { Session } from "next-auth";
import Link from "next/dist/client/link";
import s from "./comments.module.scss";
import { CommentResponse } from "@/api/apis";
import { TrashIcon } from "@heroicons/react/24/solid";

interface IProps {
  comment: CommentResponse;
  auth?: Session | null;
  handleDelete: (id: string) => void;
}

const Comment = ({ comment, auth, handleDelete }: IProps) => {
  return (
    <div className={s.comment}>
      <div className={classNames("author", "mb-2")}>
        <Link href={`/${comment.user.userName}`} className="authorName">
          {comment.user.avatarUrl && (
            <img src={comment.user.avatarUrl} alt={comment.user.userName} />
          )}
          {comment.user.firstName}{" "}
          {comment.user.lastName && comment.user.lastName}
        </Link>

        <div className="authorDate">
          <span>{formatDate(comment.createdAtUtc)}</span>
        </div>

        {auth?.user?.id == comment.user.id && (
          <div className="authorIcon">
            <button
              className={classNames("btn btn--link", s.delete)}
              onClick={() => {
                handleDelete(comment.id);
              }}
            >
              <TrashIcon width={"1rem"} />
            </button>
          </div>
        )}
      </div>

      <div className={s.commentBody} style={{ whiteSpace: "pre-line" }}>
        {comment.body}
      </div>
    </div>
  );
};

export default Comment;
