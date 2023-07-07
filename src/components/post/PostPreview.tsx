/* eslint-disable @next/next/no-img-element */

import { IPost, IUser } from "@/types";
import { formatDate } from "@/utils/format-date";
import classNames from "classnames";
import Link from "next/link";
import s from "./postPreview.module.scss";

interface IProps {
  post: IPost;
  author: IUser;
  mutate: () => void;
}

export default function PostPreview({ post, author }: IProps) {
  return (
    <div key={post.id} className={s.preview}>
      <Link
        href={`/u/${author.userName}/${post.slug}`}
        className="post-image-preview mb-4"
      >
        {post?.coverUrl ? (
          <img src={post.coverUrl} alt={post.title} loading="lazy" />
        ) : (
          <span className="font-bold">B.LAZY</span>
        )}
      </Link>

      <div className={classNames("author", "mb-2")}>
        <Link href={`/u/${author.userName}`} className="authorName">
          {author?.avatarUrl && (
            <img src={author.avatarUrl} alt={author.userName} />
          )}
          {author.firstName} {author.lastName}
        </Link>

        <div className="authorDate">
          <span>{formatDate(post.createdAtUtc)}</span>
        </div>
      </div>

      <Link
        className={classNames("block mb-2 ", s.previewTitle)}
        href={`/u/${author.userName}/${post.slug}`}
      >
        <h2 className={classNames("text-md font-bold")}>{post.title}</h2>
        {post.summary && <p className={s.previewSummary}>{post.summary}</p>}
      </Link>
    </div>
  );
}
