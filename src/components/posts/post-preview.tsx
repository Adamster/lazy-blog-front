/* eslint-disable @next/next/no-img-element */

import { DisplayPostResponse, UserPostItem, UserResponse } from "@/api/apis";
import { useTheme } from "@/providers/theme-providers";
import { Divider, Image, User } from "@heroui/react";
import Link from "next/link";
import {
  PostDetailsComments,
  PostDetailsData,
  PostDetailsRating,
  PostDetailsTags,
  PostDetailsViews,
} from "./details/post-details";
interface IProps {
  post: DisplayPostResponse | UserPostItem;
  author: UserResponse;
  hideAuthor?: boolean;
  hideTags?: boolean;
}

export default function PostPreview({
  post,
  author,
  hideAuthor = false,
  hideTags = false,
}: IProps) {
  const { showPreviews } = useTheme();

  return (
    <>
      <div className="relative flex w-full sm:flex-row gap-6">
        <div className="flex justify-center flex-col gap-3">
          <Link
            href={`/${author.userName?.toLowerCase()}`}
            className={hideAuthor ? "hidden" : "pe-24 md:pe-0"}
          >
            <User
              className="hover:opacity-70 transition-opacity"
              avatarProps={{
                size: "sm",
                src: author.avatarUrl || undefined,
                name: `${author.firstName?.charAt(0)}${author.lastName?.charAt(
                  0
                )}`,
              }}
              name={`${author.firstName} ${author.lastName}`}
              description={"@" + author.userName}
            />
          </Link>

          <div className="pe-24 md:pe-0">
            <Link
              className="m-0"
              href={`/${author.userName?.toLowerCase()}/${post.slug}`}
            >
              <h2 className="text-lg font-semibold hover:underline">
                {post.title}
              </h2>
            </Link>

            {post.summary && (
              <p className="text-gray line-clamp-2 m-0">{post.summary}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-gray">
            <PostDetailsData date={post.createdAtUtc} />
            <PostDetailsViews views={post.views} />
            <PostDetailsComments comments={post.comments} />
            <PostDetailsRating rating={post.rating} />
          </div>

          {!hideTags && <PostDetailsTags tags={post.tags} />}
        </div>

        {showPreviews && post.coverUrl && (
          <Link
            className="flex items-center ms-auto absolute right-0 md:static"
            style={{}}
            href={`/${author.userName?.toLowerCase()}/${post.slug}`}
          >
            <Image
              radius="sm"
              className="w-20 h-20 min-w-20 min-h-20 md:w-28 md:h-28 md:min-w-28 md:min-h-28 object-cover"
              src={post.coverUrl}
              alt={post.title}
            />
          </Link>
        )}
      </div>

      <Divider className="layout-page-divider" />
    </>
  );
}
