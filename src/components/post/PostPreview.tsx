import { IPost } from "@/types";
import { formatDate } from "@/utils/format-date";
import { generateColor } from "@/utils/generate-color";
import { ChatBubbleLeftEllipsisIcon, EyeIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";
import Link from "next/link";
import s from "./post.module.scss";

interface IProps {
  post: IPost;
}

export const PostPreview = ({ post }: IProps) => {
  return (
    <div key={post.id} className={s.preview}>
      <div className={s.previewContent}>
        <div className={classNames(s.author, "mb-4")}>
          <Link href="#" className={s.authorName}>
            {/* <Link href={`u/${post.author.userName}`} className={s.authorName}> */}
            <div
              className={s.authorAva}
              style={{
                backgroundColor: generateColor(post.author.userName),
              }}
            ></div>
            {post.author.firstName}{" "}
            {post.author.lastName && post.author.lastName}
          </Link>

          <div className={s.stats}>
            <span>{formatDate(post.createdAtUtc)}</span>
          </div>
        </div>

        <Link className="block mb-4" href={`/post/${post.slug}`}>
          <h2 className={classNames(s.previewTitle, "text-xl font-bold")}>
            {post.title}
          </h2>
          {post.summary && <p className={s.previewSummary}>{post.summary}</p>}
        </Link>

        <Link href={`/post/${post.slug}`} className={s.previewImage}></Link>

        <div className={s.footer}>
          <div className={s.footerStats}>
            <EyeIcon className={s.footerStatsIcon}></EyeIcon>
            <span className={s.footerStatsNum}>0</span>
          </div>

          <div className={s.footerStats}>
            <ChatBubbleLeftEllipsisIcon
              className={s.footerStatsIcon}
            ></ChatBubbleLeftEllipsisIcon>
            <span className={s.footerStatsNum}>0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
