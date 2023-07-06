/* eslint-disable @next/next/no-img-element */

import { IPost } from "@/types";
import classNames from "classnames";
import dynamic from "next/dynamic";
import Link from "next/link";

import { formatDate } from "@/utils/format-date";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import "@uiw/react-markdown-preview/markdown.css";
import IsAuthor from "../guards/IsAuthor";
import s from "./postFull.module.scss";

const MDPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

interface IProps {
  post: IPost;
  mutate: () => void;
}

export const PostFull = ({ post, mutate }: IProps) => {
  return (
    <div className={s.root}>
      <div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {post.title}
            <IsAuthor userId={post.author.id}>
              <Link
                className="inline-block color-primary ml-4"
                href={`/p/edit/${post.id}`}
              >
                <PencilSquareIcon width={"1rem"} />
              </Link>
            </IsAuthor>
          </h1>

          {post.summary && <p>{post.summary}</p>}

          <div className={s.infoLine}>
            <div className={s.infoLineStat}>
              <Link href={`/u/${post.author.userName}`} className="authorName">
                {post.author.avatarUrl && (
                  <img src={post.author.avatarUrl} alt={post.author.userName} />
                )}
                {post.author.firstName} {post.author.lastName}
              </Link>
            </div>

            <div className={s.infoLineStat}>
              <span>{formatDate(post.createdAtUtc)}</span>
            </div>

            <div className={s.infoLineStat}>
              <span>{post.views} views</span>
            </div>

            {/* <div className={s.infoLineStat}>
              <span>{post.rating} karma</span>
            </div> */}
          </div>
        </div>

        {post?.coverUrl ? (
          <div className={classNames("post-image-preview", "mb-8")}>
            <img src={post.coverUrl} alt={post.title} loading="lazy" />
          </div>
        ) : (
          <>
            <hr className="mb-8" />
          </>
        )}
      </div>

      <div className={classNames(s.post, "px-0 sm:px-16")}>
        <MDPreview source={post.body} />
      </div>

      {/* <IsAuth>
        <div className={classNames(s.footerStats, "ml-auto")}>
          <PostVote rating={post.rating} postId={post.id} mutate={mutate} />
        </div>
      </IsAuth> */}

      {/* <Comments postId={post.id} /> */}
    </div>
  );
};
