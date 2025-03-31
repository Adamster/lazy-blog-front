/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import Link from "next/link";

import { PostDetailedResponse } from "@/shared/api/openapi";
import IsAuthor from "@/features/auth/guards/is-author";
import { PencilIcon } from "@heroicons/react/24/solid";
import { Badge, Button, Divider, Image, User } from "@heroui/react";
import IsAuth from "@/features/auth/guards/is-auth";
import { Loading } from "@/shared/ui/loading";
import {
  PostDetailsComments,
  PostDetailsData,
  PostDetailsRating,
  PostDetailsTags,
  PostDetailsViews,
} from "./post-details";
import { PostVote } from "./post-vote";
import { useCommentsById } from "@/features/comment/model/use-comments-by-id";
import { Comments } from "@/features/comment/ui/comments-section";

const MDPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
  loading: () => <Loading inline />,
});

interface IProps {
  post: PostDetailedResponse | undefined;
}

export const PostView = ({ post }: IProps) => {
  const { data: postComments, isLoading: postCommentsLoading } =
    useCommentsById(post?.id || "");

  return (
    post && (
      <div className="layout-page">
        <div className="layout-page-content">
          {post.coverUrl && (
            <div className="flex w-full mb-4">
              <Image
                radius="sm"
                className="max-w-full w-full"
                removeWrapper
                src={post.coverUrl}
                alt={post.title}
              />
            </div>
          )}

          <MDPreview source={post.body} />

          <IsAuth>
            <IsAuthor
              fallback={<PostVote postId={post.id} postSlug={post.slug} />}
              userId={post.author.id || ""}
            >
              <></>
            </IsAuthor>
          </IsAuth>

          <Comments
            postId={post.id}
            postComments={postComments}
            postCommentsLoading={postCommentsLoading}
            isPostPublished={post.isPublished}
          />
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            <div className="layout-page-aside-content-sticky">
              <IsAuthor userId={post?.author.id || ""}>
                <Button
                  className="absolute -top-0 -right-0 ms-2"
                  as={Link}
                  variant="flat"
                  size="sm"
                  isIconOnly
                  href={`/${post.author.userName}/${post.slug}/edit`}
                >
                  <PencilIcon className="w-3 h-3" />
                </Button>
              </IsAuthor>

              <Link href={`/${post.author.userName}`}>
                <User
                  key={post?.author.id}
                  avatarProps={{
                    size: "sm",
                    src: post?.author.avatarUrl || undefined,
                    name: `${post?.author.firstName?.charAt(
                      0
                    )}${post?.author.lastName?.charAt(0)}`,
                  }}
                  name={`${post?.author.firstName} ${post?.author.lastName}`}
                  description={"@" + post?.author.userName}
                />
              </Link>

              <div>
                <h1 className="text-xl font-semibold mb-1 relative">
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
                </h1>
                <p className="text-gray">{post?.summary}</p>
              </div>

              <Divider />

              <div className="flex flex-wrap items-center gap-4 text-gray">
                <PostDetailsData date={post.createdAtUtc} />
                <div className="flex flex-wrap items-center gap-4 text-gray">
                  <PostDetailsViews views={post.views} />
                  <PostDetailsComments comments={postComments?.length || 0} />
                  <PostDetailsRating rating={post.rating} />
                </div>
              </div>

              <PostDetailsTags tags={post.tags} />
            </div>
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    )
  );
};
