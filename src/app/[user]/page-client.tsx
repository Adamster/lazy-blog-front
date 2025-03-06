"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { apiClient } from "@/api/api-client";
import { Loading } from "@/components/loading";
import { Divider, User } from "@heroui/react";
import { PostsList } from "@/components/posts/posts-list";
import { ErrorMessage } from "@/components/errors/error-message";
import { formatDate2 } from "@/utils/format-date";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";

export default function UserClient() {
  const { user: userName } = useParams<{ user: string }>();
  const observerRef = useRef(null);
  const PAGE_SIZE = 24;

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["getPostsByUserName", userName],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.posts.getPostsByUserName({
        userName,
        offset: pageParam,
      });
      return response;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.postItems.length === PAGE_SIZE
        ? pages.length * PAGE_SIZE
        : undefined,
    initialPageParam: 0,
    enabled: !!userName,
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

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const posts = data?.pages.flatMap((page) => page.postItems) || [];
  const user = data?.pages[0].user || null;

  return (
    <>
      <div className="layout-page">
        <div className="layout-page-content">
          {posts.length > 0 ? (
            <>
              <PostsList posts={posts} author={user} hideAuthor />
            </>
          ) : (
            <p>No Posts</p>
          )}
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            {user && (
              <aside className="layout-page-aside-content-sticky">
                <User
                  className="mb-1"
                  key={user.id}
                  avatarProps={{
                    size: "md",
                    src: user.avatarUrl || undefined,
                    name: `${user.firstName?.charAt(0)}${user.lastName?.charAt(
                      0
                    )}`,
                  }}
                  name={`${user.firstName} ${user.lastName}`}
                  description={"@" + user.userName}
                />

                <div className="text-zinc-500">
                  <p>About:</p>
                </div>

                <div className="flex items-center gap-4 text-zinc-500">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="ml-1 text-sm">
                      {formatDate2(user.createdOnUtc || "")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <PencilSquareIcon className="w-4 h-4" />
                    <span className="ml-1 text-sm">{posts.length}</span>
                  </div>
                </div>
              </aside>
            )}
          </div>

          <Divider className="layout-page-divider md:hidden mt-6" />
        </div>
      </div>

      {isFetchingNextPage && <Loading inline />}
      {hasNextPage && <div ref={observerRef} className="h-20" />}
    </>
  );
}
