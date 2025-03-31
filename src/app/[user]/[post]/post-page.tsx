"use client";

import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { PostView } from "@/features/post/ui/post-view";
import { usePostBySlug } from "@/features/post/model/use-post-by-slug";
import { useIncrementViewPost } from "@/features/post/model/use-increment-view-post";

export default function PostPage({ slug }: { slug: string }) {
  const { data, error, isLoading } = usePostBySlug(slug);

  useIncrementViewPost(data?.id || "", data?.author?.id || "");

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return <PostView post={data} />;
}
