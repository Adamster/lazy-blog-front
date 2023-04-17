import { IAuthSession, IComment } from "@/types";
import { formatDate } from "@/utils/format-date";
import { generateColor } from "@/utils/generate-color";
import classNames from "classnames";
import Link from "next/dist/client/link";
import s from "./comments.module.scss";

interface IProps {
  comment: IComment;
  auth?: IAuthSession;
  setRequesting: any;
}

const Comment = ({ comment, auth, setRequesting }: IProps) => {
  // const handleEdit = async (e: any) => {
  //   e.preventDefault();

  //   if (confirm("Ты точно хочешь удолить этот коммент?")) {
  //     setRequesting(true);

  //     await axios
  //       .delete(`${API_URL}/comments/${comment.id}`, {
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${auth?.user?.token}`,
  //         },
  //       })
  //       .then((response) => {
  //         alert("Успешно");
  //       })
  //       .catch(({ response }) => {
  //         alert("Ошибкен");
  //       })
  //       .finally(() => {
  //         setRequesting(false);
  //       });
  //   }
  // };

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
        {/* {auth?.user?.id == comment.user.id && (
          <button className={"btn btn--edit"} onClick={handleEdit}>
            <PaintBrushIcon width={"1rem"} />
          </button>
        )} */}
      </div>
      <div className={s.commentBody}>{comment.body}</div>
    </div>
  );
};

export default Comment;
