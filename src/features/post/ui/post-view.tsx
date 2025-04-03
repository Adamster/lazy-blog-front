/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";

import { PostDetailedResponse } from "@/shared/api/openapi";
import { IsAuthor } from "@/features/auth/guards/is-author";
import { ChevronLeftIcon, PencilIcon } from "@heroicons/react/24/solid";
import { Badge, Button, cn, Divider, Image } from "@heroui/react";
import { IsAuth } from "@/features/auth/guards/is-auth";
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
import { UserAvatar } from "@/features/user/ui/user-avatar";
import { useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

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

  const [fullView, setFullView] = useState(false);

  return (
    post && (
      <div className={cn("layout-page", fullView ? "full" : "")}>
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
              fallback={
                <PostVote
                  voteDirection={post.voteDirection}
                  postId={post.id}
                  postSlug={post.slug}
                />
              }
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

          <div className="layout-page-aside-wrapper">
            <div className="layout-page-aside-sticky">
              <Button
                className="layout-page-view-toggle bg-background border-1 min-w-6 w-6 h-6"
                size="sm"
                isIconOnly
                variant="bordered"
                radius="full"
                onPress={() => setFullView((view) => !view)}
              >
                {fullView ? (
                  <ChevronLeftIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </Button>

              <UserAvatar user={post.author} isLink />

              <div className="w-full">
                <h1 className="text-xl font-semibold mb-1 relative pe-10">
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

                  <IsAuthor userId={post?.author.id || ""}>
                    <Button
                      as={Link}
                      variant="flat"
                      color="primary"
                      className="min-w-6 h-6 w-6 absolute top-[5%] right-0 translate-x-1/2 -translate-y-1/2"
                      isIconOnly
                      href={`/${post.author.userName}/${post.slug}/edit`}
                    >
                      <PencilIcon className="w-3 h-3" />
                    </Button>
                  </IsAuthor>
                </h1>
                <p className="text-gray">{post?.summary}</p>
              </div>

              <Divider className="layout-page-divider" />

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
