"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/api/api-client";
import ErrorMessage from "@/components/errorMessages/ErrorMessage";
import Loading from "@/components/loading";
import { PostFull } from "@/components/post/PostFull";

export default function PostClient({ postSlug }: { postSlug: string }) {
  // const { data: auth } = useSession();
  // const hasViewed = useRef(false);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["apiPostsSlugGet", postSlug],
    queryFn: () => apiClient.posts.apiPostsSlugGet({ slug: postSlug }),
    enabled: !!postSlug,
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
  if (error) return <ErrorMessage code={error.message} />;

  return <PostFull post={data} mutate={refetch} />;
}
