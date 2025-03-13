/* eslint-disable @next/next/no-img-element */

import { DisplayPostResponse, UserPostItem, UserResponse } from "@/api/apis";
import { useTheme } from "@/providers/theme-providers";
import { formatDate2 } from "@/utils/format-date";
import { titleToSnake } from "@/utils/utils";
import {
  ChatBubbleLeftIcon as ChatBubbleLeftIconOutline,
  EyeIcon as EyeIconOutline,
  HeartIcon as HeartIconOutline,
} from "@heroicons/react/24/outline";
import {
  CalendarIcon,
  ChatBubbleLeftIcon as ChatBubbleLeftIconSolid,
  EyeIcon as EyeIconSolid,
  HeartIcon as HeartIconSolid,
  TagIcon,
} from "@heroicons/react/24/solid";
import { Divider, Image, User } from "@heroui/react";
import Link from "next/link";
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
      <div className="flex  sm:flex-row gap-6">
        <div className="flex justify-center flex-col gap-3">
          <Link
            href={`/${author.userName?.toLowerCase()}`}
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
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span className="ml-1 text-sm">
                {formatDate2(post.createdAtUtc)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {post.views > 0 ? (
                <EyeIconSolid className={"w-4 h-4"} />
              ) : (
                <EyeIconOutline className={"w-4 h-4"} />
              )}
              <span className="ml-1 text-sm">{post.views}</span>
            </div>

            <div className="flex items-center gap-1">
              {post.comments > 0 ? (
                <ChatBubbleLeftIconSolid className="w-4 h-4" />
              ) : (
                <ChatBubbleLeftIconOutline className="w-4 h-4" />
              )}
              <span className="ml-1 text-sm">{post.comments}</span>
            </div>

            <div className="flex items-center gap-1">
              {post.rating > 0 ? (
                <HeartIconSolid className={"w-4 h-4"} />
              ) : (
                <HeartIconOutline className={"w-4 h-4"} />
              )}
              <span className="ml-1 text-sm">{post.rating}</span>
            </div>
          </div>

          {!hideTags && post.tags?.length ? (
            <div className="flex items-center gap-1 text-sky-600">
              <TagIcon className={"w-4 h-4"} />
              {post.tags.map((tag, id) => (
                <span key={tag.tagId}>
                  <Link
                    href={`/tag/${titleToSnake(tag.tag)}`}
                    className="ml-1 text-sm hover:underline"
                  >
                    {tag.tag}
                  </Link>
                  {++id < post.tags.length && ","}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {showPreviews && post.coverUrl && (
          <Link
            className="flex items-center ms-auto"
            style={{}}
            href={`/${author.userName?.toLowerCase()}/${post.slug}`}
          >
            <Image
              className="w-24 h-24 min-w-24 min-h-24 md:w-32 md:h-32 md:min-w-32 md:min-h-32 object-cover"
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
