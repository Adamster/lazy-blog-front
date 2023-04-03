import { formatDate } from "@/helpers";
import { IPostFull } from "@/types";
import classNames from "classnames";
import Link from "next/link";

import s from "./post.module.scss";

interface IProps {
  post: IPostFull;
}

export const PostFull = ({ post }: IProps) => {
  return (
    <>
      <div className={classNames(s.previewContent, "mb-4")}>
        <div className={classNames(s.author, "mb-4")}>
          <Link href="/" className={s.authorName}>
            <div className={s.authorAva}></div>
            {post.author.firstName}{" "}
            {post.author.lastName && post.author.lastName}
          </Link>

          <div className={s.publishDate}>
            <span>{formatDate(post.createdAtUtc)}</span>
          </div>
        </div>

        <div className={s.postTitleContainer}>
          <h1 className={classNames(s.previewTitle, "text-2xl font-bold")}>
            {post.title}
          </h1>
          {post.summary && <p className={s.previewSummary}>{post.summary}</p>}
        </div>
      </div>

      <div className={s.full}>
        <div>{post.body}</div>
      </div>
    </>
  );
};
