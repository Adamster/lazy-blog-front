"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/api/api-client";
import { PostView } from "@/components/posts/post-view";
import { Loading } from "@/components/loading";
import { useParams } from "next/navigation";
import { ErrorMessage } from "@/components/errors/error-message";
import { PostDetailedResponse } from "@/api/apis";

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

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return <PostView post={data} postRefetch={postRefetch} />;
}
