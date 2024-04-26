/* eslint-disable @next/next/no-img-element */

import { IPost, IUser } from "@/types";
import { formatDate } from "@/utils/format-date";
import { ChatBubbleOvalLeftEllipsisIcon, StarIcon } from "@heroicons/react/24/outline";
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

      <div className={s.previewCover}>
        <Link
          href={`/u/${author.userName}/${post.slug}`}
          className="post-image-preview"
        >
          {post?.coverUrl ? (
            <img src={post.coverUrl} alt={post.title} loading="lazy" />
          ) : (
            <span className="font-bold">B.LAZY</span>
          )}
        </Link>
      </div>

      <div className={s.previewContent}>
        <div className={classNames("author mb-2")}>
          <Link href={`/u/${author.userName}`} className="authorName">
            {author?.avatarUrl && (
              <img src={author.avatarUrl} alt={author.userName} />
            )}
            {author.firstName} {author.lastName}
          </Link>

          <div className="authorDate">
            <span>{formatDate(post.createdAtUtc)}</span>
          </div>

          <div className="postInfo">
            <span className="flex" style={{ color: post.rating > 0 ? 'var(--color-primary)' : 'inherit' }}>
              <StarIcon width={'1rem'} />
              <span className="ml-1 mr-3">{post.rating}</span>
            </span>

            <span className="flex" style={{ color: post.comments > 0 ? 'var(--color-primary)' : 'inherit' }} >
              <ChatBubbleOvalLeftEllipsisIcon width={'1rem'} />
              <span className="ml-1">{post.comments}</span>
            </span>

          </div>
        </div>

        <hr className="mb-2" />

        <Link
          href={`/u/${author.userName}/${post.slug}`}
          className="mb-4"
        >
          <span className={s.previewTitle}>
            <h2 className={classNames("text-lg font-bold")}>{post.title}</h2>
            {post.summary && <p className={s.previewSummary}>{post.summary}</p>}
          </span>
        </Link>
      </div>



    </div>
  );
}
