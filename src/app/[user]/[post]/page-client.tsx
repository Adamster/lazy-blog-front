"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/api/api-client";
import { PostView } from "@/components/posts/post-view";
import { Loading } from "@/components/loading";
import { useParams } from "next/navigation";
import { ErrorMessage } from "@/components/errors/error-message";

export default function PostClient() {
  const { post: slug } = useParams<{ post: string }>();

  const {
    data,
    error,
    isLoading,
    refetch: postRefetch,
  } = useQuery({
    queryKey: ["getPostsBySlug", slug],
    queryFn: () => apiClient.posts.getPostsBySlug({ slug }),
    enabled: !!slug,
    retry: 1,
  });

  // useEffect(() => {
  //   if (
  //     !data?.id ||
  //     !auth?.user?.id ||
  //     data?.author?.id === auth?.user?.id ||
  //     hasViewed.current
  //   )
  //     return;

  //   hasViewed.current = true;
  //   const timeout = setTimeout(() => {
  //     axios.put(`/api/posts/${data.id}/count-view`);
  //   }, 10000);

  //   return () => clearTimeout(timeout);
  // }, [data?.id, auth?.user?.id]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return <PostView post={data} postRefetch={postRefetch} />;
}
