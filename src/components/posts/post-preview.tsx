/* eslint-disable @next/next/no-img-element */

import { DisplayPostResponse, UserPostItem, UserResponse } from "@/api/apis";
import { useTheme } from "@/providers/theme-providers";
import { Badge, Divider, Image, User } from "@heroui/react";
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
      <div className="flex w-full flex-col gap-6">
        <div className="flex justify-center flex-col gap-3">
          <Link
            href={`/${author.userName}`}
            className={hideAuthor ? "hidden" : ""}
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

          <div>
            <div>
              <Link className="m-0" href={`/${author.userName}/${post.slug}`}>
                <h2 className="text-lg font-semibold hover:underline">
                  {!post.isPublished ? (
                    <Badge
                      color="warning"
                      size="lg"
                      content="Draft"
                      placement="top-right"
                    >
                      {post.title}
                    </Badge>
                  ) : (
                    post.title
                  )}
                </h2>
              </Link>
            </div>

            {post.summary && <p className="text-gray m-0">{post.summary}</p>}
          </div>

          {showPreviews && post.coverUrl && (
            <Link
              className="flex items-center w-full"
              style={{}}
              href={`/${author.userName}/${post.slug}`}
            >
              <Image
                removeWrapper
                radius="sm"
                className="max-w-full w-full"
                src={post.coverUrl}
                alt={post.title}
              />
            </Link>
          )}

          <div className="flex flex-wrap items-center gap-4 text-gray">
            <PostDetailsData date={post.createdAtUtc} />
            <PostDetailsViews views={post.views} />
            <PostDetailsComments comments={post.comments} />
            <PostDetailsRating rating={post.rating} />
          </div>

          {!hideTags && <PostDetailsTags tags={post.tags} />}
        </div>
      </div>

      <Divider className="layout-page-divider" />
    </>
  );
}
