/* eslint-disable @next/next/no-img-element */
import { IPost } from "@/types";
import { formatDate } from "@/utils/format-date";
import { generateColor } from "@/utils/generate-color";
import classNames from "classnames";
import dynamic from "next/dynamic";
import Link from "next/link";

import "@uiw/react-markdown-preview/markdown.css";
import s from "./post.module.scss";

const MDPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

interface IProps {
  post: IPost;
}

export const PostFull = ({ post }: IProps) => {
  return (
    <>
      <div className={classNames(s.full)}>
        <div className={classNames(s.author, "mb-4")}>
          <Link href={`/u/${post.author.userName}`} className={s.authorName}>
            <div
              className={s.authorAva}
              style={{
                backgroundColor: generateColor(post.author.userName),
              }}
            ></div>
            {post.author.firstName}{" "}
            {post.author.lastName && post.author.lastName}
          </Link>

          <div className={s.stats}>{formatDate(post.createdAtUtc)}</div>
        </div>

        <div className={classNames("mb-4")}>
          <h1 className="text-3xl font-bold">{post.title}</h1>
          {post.summary && <p>{post.summary}</p>}
        </div>

        {post?.coverUrl ? (
          <div className={classNames(s.previewImage, "mb-6")}>
            {post?.coverUrl && post?.coverUrl.includes("<iframe") ? (
              <div dangerouslySetInnerHTML={{ __html: post?.coverUrl }}></div>
            ) : (
              <img src={post.coverUrl} alt={post.title} />
            )}
          </div>
        ) : (
          <div className="mb-6"></div>
        )}

        <MDPreview source={post.body} />
      </div>

      {/* <Comments id="" /> */}
    </>
  );
};
