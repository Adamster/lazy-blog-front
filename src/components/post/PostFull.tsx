import { IPost } from "@/types";
import { formatDate } from "@/utils/format-date";
import { generateColor } from "@/utils/generate-color";
import classNames from "classnames";
import dynamic from "next/dynamic";
import Link from "next/link";
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
      <div className={classNames(s.author, "mb-4")}>
        <Link href="/" className={s.authorName}>
          <div
            className={s.authorAva}
            style={{
              backgroundColor: generateColor(post.author.userName),
            }}
          ></div>
          {post.author.firstName} {post.author.lastName && post.author.lastName}
        </Link>

        <div className={s.stats}>{formatDate(post.createdAtUtc)}</div>
      </div>

      <div className={classNames("mb-4")}>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        {post.summary && <p className={s.previewSummary}>{post.summary}</p>}
      </div>

      <div className={s.full}>
        <MDPreview source={post.body} />
      </div>
    </>
  );
};
