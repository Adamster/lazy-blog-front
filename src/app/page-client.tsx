"use client";

import { apiClient } from "@/api/api-client";
import { Categories } from "@/components/layout/categories";
import { Loading } from "@/components/loading";
import { PostsList } from "@/components/posts/posts-list";
import { addToast, Divider } from "@heroui/react";
import { useInfiniteQuery } from "@tanstack/react-query";

export const PageClient = () => {
  const PAGE_SIZE = 24;

  const query = useInfiniteQuery({
    queryKey: ["getAllPosts"],
    queryFn: ({ pageParam = 0 }) =>
      apiClient.posts.getAllPosts({ offset: pageParam }) ?? [],
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined,
    initialPageParam: 0,
  });

  if (query.error) {
    addToast({
      title: "Error",
      description: query.error?.message || "Unknown error",
      color: "danger",
    });
    return null;
  }

  if (query.isLoading) return <Loading />;

  return (
    <div className="layout-page">
      <div className="layout-page-content">
        {query.data?.pages?.flat && (
          <PostsList query={query} posts={query.data?.pages?.flat()} />
        )}
      </div>

      <div className="layout-page-aside hidden">
        <Divider className="layout-page-aside-divider" orientation="vertical" />

        <div className="layout-page-aside-content">
          <aside className="layout-page-aside-content-sticky">
            <div className="flex flex-col">
              <Categories />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
