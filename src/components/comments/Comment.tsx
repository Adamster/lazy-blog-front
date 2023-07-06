import { IComment } from "@/types";
import { formatDate } from "@/utils/format-date";
import classNames from "classnames";
import { Session } from "next-auth";
import Link from "next/dist/client/link";
import s from "./comments.module.scss";

interface IProps {
  comment: IComment;
  auth?: Session | null;
  handleDelete: (id: string) => void;
}

const Comment = ({ comment, auth, handleDelete }: IProps) => {
  return (
    <div className={s.comment}>
      <div className={classNames("author", "mb-2")}>
        <Link href={`/u/${comment.user.userName}`} className="authorName">
          {comment.user.avatarUrl && (
            <img src={comment.user.avatarUrl} alt={comment.user.userName} />
          )}
          {comment.user.firstName}{" "}
          {comment.user.lastName && comment.user.lastName}
        </Link>

        <div className="authorDate">
          <span>{formatDate(comment.createdAtUtc)}</span>
        </div>

        {/* {auth?.user?.id == comment.user.id && (
          <div className="authorDate">
            <button
              className={classNames("btn btn--link", s.delete)}
              onClick={() => {
                handleDelete(comment.id);
              }}
            >
              <TrashIcon width={"1rem"} />
            </button>
          </div>
        )} */}
      </div>

      <div className={s.commentBody} style={{ whiteSpace: "pre-line" }}>
        {comment.body}
      </div>
    </div>
  );
};

export default Comment;
