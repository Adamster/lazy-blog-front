import { IAuthSession, IComment } from "@/types";
import { formatDate } from "@/utils/format-date";
import { generateColor } from "@/utils/generate-color";
import { TrashIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import Link from "next/dist/client/link";
import s from "./comments.module.scss";

interface IProps {
  comment: IComment;
  auth?: IAuthSession;
  handleDelete: (id: string) => void;
}

const Comment = ({ comment, auth, handleDelete }: IProps) => {
  return (
    <div className={s.comment}>
      <div className={classNames("author", "mb-4")}>
        <Link href={`/u/${comment.user.userName}`} className="authorName">
          <div
            className="authorAva"
            style={{
              backgroundColor: generateColor(comment.user.userName),
            }}
          ></div>
          {comment.user.firstName}{" "}
          {comment.user.lastName && comment.user.lastName}
        </Link>
        <div className="authorDate">
          <span>{formatDate(comment.createdAtUtc)}</span>
        </div>
        {auth?.user?.id == comment.user.id && (
          <button
            className={classNames("btn btn--action", s.delete)}
            onClick={() => {
              handleDelete(comment.id);
            }}
          >
            <TrashIcon width={"1rem"} />
          </button>
        )}
      </div>
      <div className={s.commentBody} style={{ whiteSpace: "pre-line" }}>
        {comment.body}
      </div>
    </div>
  );
};

export default Comment;
