/* eslint-disable @typescript-eslint/no-explicit-any */
/* PostsList.tsx */

import {
  DisplayPostResponse,
  UserPostItem,
  UserResponse,
} from "@/shared/api/openapi";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import PostCard from "@/features/posts/ui/post-card";
import { Loading } from "@/shared/ui/loading";

interface PostsListProps {
  posts: DisplayPostResponse[] | UserPostItem[];
  author?: UserResponse | null;
  hideAuthor?: boolean;
  hideTags?: boolean;
  query: UseInfiniteQueryResult<InfiniteData<any, unknown>, Error>;
}

export function PostsList({
  query,
  posts,
  author,
  hideAuthor,
  hideTags,
}: PostsListProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!observerRef.current || !query.hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && query.fetchNextPage(),
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [query, query.fetchNextPage, query.hasNextPage]);

  return (
    <>
      {query.isLoading && <Loading inline />}

      <div className="flex flex-col gap-8">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            author={author || (post as DisplayPostResponse).author}
            hideAuthor={hideAuthor}
            hideTags={hideTags}
          />
        ))}
      </div>

      {query.isFetchingNextPage && <Loading inline />}
      {query.hasNextPage && <div ref={observerRef} className="h-20" />}
    </>
  );
}
