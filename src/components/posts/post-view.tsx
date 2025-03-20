"use client";

/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import Link from "next/link";

import { apiClient } from "@/api/api-client";
import { PostDetailedResponse } from "@/api/apis";
import IsAuthor from "@/guards/is-author";
import { useTheme } from "@/providers/theme-providers";
import { PencilIcon } from "@heroicons/react/24/solid";
import { Badge, Button, Divider, Image, User } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import IsAuth from "../../guards/is-auth";
import { Comments } from "../comments/comments-section";
import { Loading } from "../loading";
import {
  PostDetailsComments,
  PostDetailsData,
  PostDetailsRating,
  PostDetailsTags,
  PostDetailsViews,
} from "./details/post-details";
import { PostVote } from "./post-vote";

const MDPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
  loading: () => <Loading inline />,
});

interface IProps {
  post: PostDetailedResponse | undefined;
  postRefetch: () => void;
}

export const PostView = ({ post, postRefetch }: IProps) => {
  const { showPreviews } = useTheme();

  const {
    data: postComments,
    isLoading: postCommentsLoading,
    refetch: postCommentsRefetch,
  } = useQuery({
    queryKey: ["getCommentsByPostId", post?.id],
    queryFn: () =>
      apiClient.comments.getCommentsByPostId({ id: post?.id || "" }),
    enabled: !!post?.id,
  });

  return (
    post && (
      <div className="layout-page">
        <div className="layout-page-content">
          {showPreviews && post.coverUrl && (
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
                  rating={post.rating}
                  postId={post.id}
                  postRefetch={postRefetch}
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
            postCommentsRefetch={postCommentsRefetch}
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
                  href={`${post.slug}/edit`}
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
