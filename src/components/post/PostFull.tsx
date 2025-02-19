/* eslint-disable @next/next/no-img-element */

import classNames from "classnames";
import dynamic from "next/dynamic";
import Link from "next/link";

import { formatDate } from "@/utils/format-date";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import "@uiw/react-markdown-preview/markdown.css";
import { Comments } from "../comments/Comments";
import IsAuth from "../guards/IsAuth";
import IsAuthor from "../guards/IsAuthor";
import { PostVote } from "./PostVote";
import s from "./postFull.module.scss";
import { PostDetailedResponse } from "@/api/apis";
import Loading from "../loading";

const MDPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

interface IProps {
  post: PostDetailedResponse | undefined;
  mutate: () => void;
}

export const PostFull = ({ post, mutate }: IProps) => {
  if (!post) <Loading />;

  return (
    post && (
      <>
        <div className="wrapper p-8">
          <div className="mb-8">
            {/* Header */}

            {post?.coverUrl && (
              <div className={classNames("post-image-preview full", "mb-2")}>
                <img src={post.coverUrl} alt={post.title} loading="lazy" />
              </div>
            )}

            <div className="flex">
              <div className={s.infoLine}>
                <div className={s.infoLineStat}>
                  <Link
                    href={`/${post.author.userName}`}
                    className="authorName"
                  >
                    {post.author.avatarUrl && (
                      <img
                        src={post.author.avatarUrl}
                        alt={post.author.userName}
                      />
                    )}
                    {post.author.firstName} {post.author.lastName}
                  </Link>
                </div>

                <div className={s.infoLineStat}>
                  <span>{formatDate(post.createdAtUtc)}</span>
                </div>

                {/* <div className={s.infoLineStat}>
                  <span>{post.views} views</span>
                </div> */}

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

            <h1 className="main-title mb-2">
              {post.title}
              <IsAuthor userId={post.author.id || ""}>
                <Link
                  className="inline-block color-primary ml-4"
                  href={`${post.slug}/edit`}
                >
                  <PencilSquareIcon width={"1rem"} />
                </Link>
              </IsAuthor>
            </h1>

            {post.summary && <p className="text-center">{post.summary}</p>}
          </div>

          {/* Image */}

          {/* <hr className="mb-8" /> */}

          {/* Content */}

          <div className={"px-0 sm:px-16"}>
            <MDPreview source={post.body} />
          </div>
        </div>

        {/* Comments */}
        <Comments postId={post.id} />
      </>
    )
  );
};
