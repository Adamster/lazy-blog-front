/* eslint-disable @next/next/no-img-element */

import { formatDate2 } from "@/utils/format-date";
import Link from "next/link";
import { Divider, Image, User } from "@heroui/react";
import { PublishedPostResponse, UserPostItem, UserResponse } from "@/api/apis";
import { CalendarIcon } from "@heroicons/react/24/solid";
import {
  HeartIcon as HeartIconOutline,
  ChatBubbleLeftIcon as ChatBubbleLeftIconOutline,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartIconSolid,
  ChatBubbleLeftIcon as ChatBubbleLeftIconSolid,
} from "@heroicons/react/24/solid";
import { useTheme } from "@/providers/theme-providers";
interface IProps {
  post: PublishedPostResponse | UserPostItem;
  author: UserResponse;
  hideAuthor?: boolean;
}

export default function PostPreview({
  post,
  author,
  hideAuthor = false,
}: IProps) {
  const { showPreviews } = useTheme();

  return (
    <>
      <div className="flex  sm:flex-row gap-6">
        <div className="flex justify-center flex-col gap-3">
          <Link
            href={`/${author.userName}`}
            className={hideAuthor ? "hidden" : ""}
          >
            <User
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

          <Link href={`/${author.userName}/${post.slug}`}>
            <h2 className="text-lg font-semibold hover:text-primary transition-colors">
              {post.title}
            </h2>

            {post.summary && (
              <p className="text-zinc-500 line-clamp-2 m-0">{post.summary}</p>
            )}
          </Link>

          <div className="flex items-center gap-4 text-zinc-500">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span className="ml-1 text-sm">
                {formatDate2(post.createdAtUtc)}
              </span>
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
        </div>

        {showPreviews && post.coverUrl && (
          <Link
            className="flex items-center ms-auto"
            style={{}}
            href={`/${author.userName}/${post.slug}`}
          >
            <Image
              isZoomed
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
