/* eslint-disable @next/next/no-img-element */
import { IPost, IUser } from "@/types";
import { formatDate } from "@/utils/format-date";
import { generateColor } from "@/utils/generate-color";
import {
  ChatBubbleBottomCenterTextIcon,
  EyeIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import Link from "next/link";
import s from "./post.module.scss";

interface IProps {
  post: IPost;
  author: IUser;
  authUserId?: string | undefined;
}

export default function PostPreview({ post, author, authUserId }: IProps) {
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
              <img src={post.coverUrl} alt={post.title} />
            </Link>
          )}
        </div>

        <div className={s.footer}>
          <div className={s.footerStats}>
            <EyeIcon className={s.footerStatsIcon}></EyeIcon>
            <span className={s.footerStatsNum}>{post.views}</span>
          </div>

          <Link
            href={`/u/${author.userName}/${post.slug}#comments`}
            scroll={false}
            className={s.footerStats}
          >
            <ChatBubbleBottomCenterTextIcon
              className={s.footerStatsIcon}
            ></ChatBubbleBottomCenterTextIcon>
            <span className={s.footerStatsNum}>{post.comments}</span>
          </Link>
        </div>
      </div>

      {author.id === authUserId && (
        <Link href={`/p/edit/${post.id}`} className="btn btn--edit">
          <PaintBrushIcon width={"1rem"} />
        </Link>
      )}
    </div>
  );
}
