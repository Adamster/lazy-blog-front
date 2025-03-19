"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/api/api-client";
import { PostDetailedResponse } from "@/api/apis";
import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/components/loading";
import { PostView } from "@/components/posts/post-view";
import usePostIncrementView from "@/hooks/use-post-increment-view";
import { useParams } from "next/navigation";

export default function PostClient({ post }: { post: PostDetailedResponse }) {
  const { post: slug } = useParams<{ post: string }>();

  const {
    data,
    error,
    isLoading,
    refetch: postRefetch,
  } = useQuery({
    queryKey: ["getPostBySlug", slug],
    queryFn: () => apiClient.posts.getPostBySlug({ slug }),
    initialData: post,
    enabled: !post,
    retry: 1,
  });

  usePostIncrementView(data?.id || "", data?.author?.id || "");

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return <PostView post={data} postRefetch={postRefetch} />;
}
