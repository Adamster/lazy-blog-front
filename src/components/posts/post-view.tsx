"use client";

/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import Link from "next/link";

import { formatDate2 } from "@/utils/format-date";
import "@uiw/react-markdown-preview/markdown.css";
import IsAuth from "../../guards/is-auth";
import { PostVote } from "../post/PostVote";
import { PostDetailedResponse } from "@/api/apis";
import { Divider, Image, User } from "@heroui/react";

import {
  HeartIcon as HeartIconOutline,
  ChatBubbleLeftIcon as ChatBubbleLeftIconOutline,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartIconSolid,
  ChatBubbleLeftIcon as ChatBubbleLeftIconSolid,
  CalendarIcon,
} from "@heroicons/react/24/solid";
import { Comments } from "../commnts/comments-section";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/api-client";

const MDPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

interface IProps {
  post: PostDetailedResponse | undefined;
  postRefetch: () => void;
}

export const PostView = ({ post, postRefetch }: IProps) => {
  const {
    data: postComments,
    isLoading: postCommentsLoading,
    refetch: postCommentsRefetch,
  } = useQuery({
    queryKey: ["getCommentsByPostId", post?.id],
    queryFn: () => apiClient.posts.getCommentsByPostId({ id: post?.id || "" }),
    enabled: !!post?.id,
  });

  return (
    post && (
      <div className="layout-page">
        <div className="layout-page-content">
          {/* {post?.coverUrl && (
            <div className="flex w-full justify-center items-center bg-zinc-100 mb-6 rounded-2xl p-6">
              <Image
                isBlurred
                className="self-center "
                removeWrapper
                // radius="lg"
                style={{
                  maxWidth: "100%",
                }}
                src={post.coverUrl}
                alt={post.title}
              />
            </div>
          )} */}

          <MDPreview source={post.body} />
          <Comments
            postId={post.id}
            postComments={postComments}
            postCommentsLoading={postCommentsLoading}
            postCommentsRefetch={postCommentsRefetch}
          />
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            <div className="layout-page-aside-content-sticky">
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
                <h1 className="text-xl font-semibold mb-1">{post?.title}</h1>
                <p className="text-zinc-500">{post?.summary}</p>
              </div>

              <div className="flex items-center gap-4 text-zinc-500">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-sm">
                    {formatDate2(post.createdAtUtc)}
                  </span>
                </div>

                <IsAuth
                  fallback={
                    <div className="flex items-center gap-1">
                      {post?.rating > 0 ? (
                        <HeartIconSolid className={"w-4 h-4"} />
                      ) : (
                        <HeartIconOutline className={"w-4 h-4"} />
                      )}
                      <span className="ml-1 text-sm">{post?.rating}</span>
                    </div>
                  }
                >
                  <PostVote
                    rating={post.rating}
                    postId={post.id}
                    mutate={postRefetch}
                  />
                </IsAuth>

                <div className="flex items-center gap-1">
                  {postComments?.length || 0 > 0 ? (
                    <ChatBubbleLeftIconSolid className="w-4 h-4" />
                  ) : (
                    <ChatBubbleLeftIconOutline className="w-4 h-4" />
                  )}
                  <span className="ml-1 text-sm">{postComments?.length}</span>
                </div>
              </div>

              {/* <div className="flex justify-center items-center mt-4">
                <Image
                  // isBlurred
                  // isZoomed
                  // radius="none"
                  // shadow="md"
                  // removeWrapper
                  className="sm:flex object-cover "
                  src={post.coverUrl || ""}
                  alt={post.title}
                  // width={180}
                  // height={100}
                  style={{
                    // minWidth: "100px",
                    maxHeight: "10rem",
                  }}
                />
              </div> */}
            </div>
          </div>
        </div>
      </div>
    )
  );
};

// <div>
//   {/* <Markdown remarkPlugins={[remarkGfm]}>{post.body}</Markdown>
//   <MarkdownHooks rehypePlugins={[rehypeStarryNight]}>
//     {post.body}
//   </MarkdownHooks> */}
// </div>
