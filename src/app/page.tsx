"use client";

import { apiClient } from "@/api/api-client";
import ErrorMessage from "@/components/errorMessages/ErrorMessage";
import Loading from "@/components/loading";
import PostPreview from "@/components/post/PostPreview";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export default function Home() {
  const observerRef = useRef(null);
  const PAGE_SIZE = 12;

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["apiPostsGet"],
    queryFn: ({ pageParam = 0 }) =>
      apiClient.posts.apiPostsGet({ offset: pageParam }) ?? [],
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined,
    initialPageParam: 0,
  });

  useEffect(() => {
    if (!observerRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextPage(),
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  if (error) return <ErrorMessage code={error.message || "Unknown error"} />;

  return (
    <div className="wrapper p-8">
      {(isLoading || isFetchingNextPage) && <Loading />}

      <div className="postsGrid">
        {data?.pages?.flat().map((post) => (
          <PostPreview key={post.id} post={post} author={post.author} />
        ))}
      </div>

      <div ref={observerRef} className="h-10" />
    </div>
  );
}
