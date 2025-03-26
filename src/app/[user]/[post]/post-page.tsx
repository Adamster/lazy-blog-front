"use client";

import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/shared/ui/loading";
import { PostView } from "@/components/posts/post-view";
import { usePostBySlug } from "@/features/posts/model/use-post-by-slug";
import useViewPost from "@/features/posts/model/use-view-post";

export default function PostPage({ slug }: { slug: string }) {
  const { data, error, isLoading } = usePostBySlug(slug);

  useViewPost(data?.id || "", data?.author?.id || "");

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return <PostView post={data} />;
}
