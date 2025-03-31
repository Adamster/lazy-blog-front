import {
  DisplayPostResponse,
  UserPostItem,
  UserResponse,
} from "@/shared/api/openapi";
import { Badge, Divider, Image } from "@heroui/react";
import Link from "next/link";
import {
  PostDetailsComments,
  PostDetailsData,
  PostDetailsRating,
  PostDetailsTags,
  PostDetailsViews,
} from "@/features/post/ui/post-details";
import { UserAvatar } from "@/features/user/ui/user-avatar";
interface IProps {
  post: DisplayPostResponse | UserPostItem;
  author: UserResponse;
  hideAuthor?: boolean;
  hideTags?: boolean;
}

export default function PostCard({
  post,
  author,
  hideAuthor = false,
  hideTags = false,
}: IProps) {
  return (
    <>
      <div className="flex w-full flex-col gap-6">
        <div className="flex justify-center flex-col gap-4">
          {!hideAuthor && <UserAvatar user={author} isLink />}

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

            {post.summary && <p className="text-gray m-0">{post.summary}</p>}
          </div>

          {post.coverUrl ? (
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
          ) : (
            <span></span>
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
