/* eslint-disable @next/next/no-img-element */

import { IPost } from "@/types";
import classNames from "classnames";
import dynamic from "next/dynamic";
import Link from "next/link";

import { formatDate } from "@/utils/format-date";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import "@uiw/react-markdown-preview/markdown.css";
import { Comments } from "../comments/Comments";
import IsAuth from "../guards/IsAuth";
import IsAuthor from "../guards/IsAuthor";
import s from "./postFull.module.scss";
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
      <div className="wrapper-md p-8">
        <div className="mb-8">
          {/* Header */}

          <h1 className="main-title">
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

          {post.summary && <p className="text-center">{post.summary}</p>}

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

            <div className={s.infoLineStat}>
              <IsAuth isNot={<span>{post.rating} likes</span>}>
                <PostVote
                  rating={post.rating}
                  postId={post.id}
                  mutate={mutate}
                />
              </IsAuth>
            </div>
          </div>
        </div>

        {/* Image */}

        {post?.coverUrl ? (
          <div className={classNames("post-image-preview", "mb-8")}>
            <img src={post.coverUrl} alt={post.title} loading="lazy" />
          </div>
        ) : (
          <>
            <hr className="mb-8" />
          </>
        )}

        {/* Content */}

        <div className={"px-0 sm:px-16"}>
          <MDPreview source={post.body} />
        </div>
      </div>

      {/* Comments */}
      <Comments postId={post.id} />
    </>
  );
};
