/* eslint-disable @next/next/no-img-element */

import { IPost } from "@/types";
import { formatDate } from "@/utils/format-date";
import { generateColor } from "@/utils/generate-color";
import classNames from "classnames";
import dynamic from "next/dynamic";
import Link from "next/link";

import { EyeIcon, PaintBrushIcon } from "@heroicons/react/24/outline";
import "@uiw/react-markdown-preview/markdown.css";
import { Comments } from "../comments/Comments";
import IsAuth from "../guards/IsAuth";
import IsAuthor from "../guards/IsAuthor";
import s from "./post.module.scss";
import { PostVote } from "./PostVote";

const MDPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

interface IProps {
  post: IPost;
  mutate: () => void;
}

export const PostFull = ({ post, mutate }: IProps) => {
  return (
    <>
      <div className={classNames(s.full)}>
        <div className={classNames("author", "mb-4")}>
          <Link href={`/u/${post.author.userName}`} className="authorName">
            <div
              className="authorAva"
              style={{
                backgroundColor: generateColor(post.author.userName),
              }}
            ></div>
            {post.author.firstName}{" "}
            {post.author.lastName && post.author.lastName}
          </Link>

          <div className="authorDate">{formatDate(post.createdAtUtc)}</div>
        </div>

        <div>
          <h1 className="text-3xl font-bold">{post.title}</h1>
          {post.summary && <p>{post.summary}</p>}
        </div>

        {post?.coverUrl && (
          <div className={classNames(s.previewImage, "mt-4")}>
            <img src={post.coverUrl} alt={post.title} loading="lazy" />
          </div>
        )}

        <IsAuthor userId={post.author.id}>
          <Link href={`/p/edit/${post.id}`} className="btn btn--edit">
            <PaintBrushIcon width={"1rem"} />
          </Link>
        </IsAuthor>
      </div>

      <div className={classNames(s.full)}>
        <MDPreview source={post.body} />
      </div>

      <div className={s.footerFull}>
        <div className={s.footerStats}>
          <EyeIcon className={s.footerStatsIcon}></EyeIcon>
          <span className={s.footerStatsNum}>{post.views}</span>
        </div>

        <IsAuth>
          <div className={classNames(s.footerStats, "ml-auto")}>
            <PostVote rating={post.rating} postId={post.id} mutate={mutate} />
          </div>
        </IsAuth>
      </div>

      <Comments postId={post.id} />
    </>
  );
};
