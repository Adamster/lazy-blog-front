import { PostDetailedResponse } from "@/shared/api/openapi";
import { IsAuthor } from "@/features/auth/guards/is-author";
import { ChevronLeftIcon, PencilIcon } from "@heroicons/react/24/solid";
import { Badge, Button, cn, Divider, Image } from "@heroui/react";
import { IsAuth } from "@/features/auth/guards/is-auth";
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
import { Crepe } from "./crepe-wrapper";

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
            <div className="mb-4 flex w-full">
              <Image
                radius="sm"
                className="w-full max-w-full"
                removeWrapper
                src={post.coverUrl}
                alt={post.title}
              />
            </div>
          )}

          <Crepe readonly markdown={post.body} />

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
                className="layout-page-view-toggle bg-background h-6 w-6 min-w-6 border-1"
                size="sm"
                isIconOnly
                variant="bordered"
                radius="full"
                onPress={() => setFullView((view) => !view)}
              >
                {fullView ? (
                  <ChevronLeftIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </Button>

              <UserAvatar user={post.author} isLink />

              <div className="w-full">
                <h1 className="relative mb-1 pe-10 text-xl font-semibold">
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
                      className="absolute top-[5%] right-0 h-6 w-6 min-w-6 translate-x-1/2 -translate-y-1/2"
                      isIconOnly
                      href={`/${post.author.userName}/${post.slug}/edit`}
                    >
                      <PencilIcon className="h-3 w-3" />
                    </Button>
                  </IsAuthor>
                </h1>
                <p className="text-gray">{post?.summary}</p>
              </div>

              <Divider className="layout-page-divider" />

              <div className="text-gray flex w-full flex-wrap items-center gap-4">
                <div className="text-gray flex w-full flex-wrap items-center gap-4">
                  <PostDetailsData date={post.createdAtUtc} />
                  <PostDetailsViews views={post.views} />
                  <PostDetailsComments comments={postComments?.length || 0} />
                  <PostDetailsRating rating={post.rating} />
                </div>

                <PostDetailsTags tags={post.tags} />

                <IsAuth>
                  <IsAuthor
                    fallback={
                      <PostVote
                        voteDirection={post.voteDirection}
                        postId={post.id}
                        postSlug={post.slug}
                        rating={post.rating}
                      />
                    }
                    userId={post.author.id || ""}
                  >
                    <></>
                  </IsAuthor>
                </IsAuth>
              </div>
            </div>
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    )
  );
};
