import { IPost } from "@/types";
import { formatDate } from "@/utils/format-date";
import classNames from "classnames";
import Link from "next/link";

import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import dynamic from "next/dynamic";

const MDPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

import s from "./post.module.scss";

interface IProps {
  post: IPost;
}

export const PostFull = ({ post }: IProps) => {
  return (
    <>
      <div className={classNames("mb-2")}>
        <div className={s.postTitleContainer}>
          <h1 className="text-3xl font-bold">{post.title}</h1>
          {/* {post.summary && <p className={s.previewSummary}>{post.summary}</p>} */}
        </div>
      </div>

      <div className={classNames(s.author, "mb-4")}>
        <Link href="/" className={s.authorName}>
          {/* <div className={s.authorAva}></div> */}
          {post.author.firstName} {post.author.lastName && post.author.lastName}
        </Link>

        <div className={s.publishDate}>
          <span>{formatDate(post.createdAtUtc)}</span>
        </div>
      </div>

      <div className={s.full}>
        <MDPreview source={post.body} />
      </div>
    </>
  );
};
