/* eslint-disable @next/next/no-img-element */
// "use client";

import { IPost, IUser } from "@/types";
import { formatDate } from "@/utils/format-date";
import { generateColor } from "@/utils/generate-color";
import {
  ChatBubbleBottomCenterTextIcon,
  EyeIcon,
  PaintBrushIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import Link from "next/link";
import IsAuthor from "../guards/IsAuthor";
import s from "./post.module.scss";

interface IProps {
  post: IPost;
  author: IUser;
  mutate: () => void;
}

export default function PostPreview({ post, author }: IProps) {
  return (
    <div key={post.id} className={s.preview}>
      <div className={s.previewContent}>
        <div className={classNames("author", "mb-4")}>
          <Link href={`/u/${author.userName}`} className="authorName">
            <div
              className="authorAva"
              style={{
                backgroundColor: generateColor(author.userName),
              }}
            ></div>
            {author.firstName} {author.lastName && author.lastName}
          </Link>

          <div className="authorDate">
            <span>{formatDate(post.createdAtUtc)}</span>
          </div>
        </div>

        <div className={s.previewToggle}>
          <Link
            className={classNames("block mb-4", s.previewTitle)}
            href={`/u/${author.userName}/${post.slug}`}
          >
            <h2 className={classNames(s.previewTitle, "text-xl font-bold")}>
              {post.title}
            </h2>
            {post.summary && <p className={s.previewSummary}>{post.summary}</p>}
          </Link>

          {post?.coverUrl && (
            <Link
              href={`/u/${author.userName}/${post.slug}`}
              className={s.previewImage}
            >
              <img src={post.coverUrl} alt={post.title} loading="lazy" />
            </Link>
          )}
        </div>

        <div className={s.footer}>
          <div className={s.footerStats}>
            <StarIcon
              className={s.footerStatsIcon}
              style={{
                color:
                  post.rating > 0
                    ? "var(--color-primary)"
                    : post.rating < 0
                    ? "var(--color-danger)"
                    : "",
              }}
            ></StarIcon>
            <span className={s.footerStatsNum}>{post.rating}</span>
          </div>

          <div className={s.footerStats}>
            <EyeIcon className={s.footerStatsIcon}></EyeIcon>
            <span className={s.footerStatsNum}>{post.views}</span>
          </div>

          <div className={s.footerStats}>
            <ChatBubbleBottomCenterTextIcon
              className={s.footerStatsIcon}
            ></ChatBubbleBottomCenterTextIcon>
            <span className={s.footerStatsNum}>{post.comments}</span>
          </div>

          <div className={classNames(s.footerStats, "ml-auto")}></div>
        </div>
      </div>

      <IsAuthor userId={author.id}>
        <Link
          href={`/p/edit/${post.id}`}
          className="btn btn--edit"
          scroll={false}
        >
          <PaintBrushIcon width={"1rem"} />
        </Link>
      </IsAuthor>
    </div>
  );
}
