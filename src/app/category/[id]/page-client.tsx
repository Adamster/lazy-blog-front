"use client";

import { apiClient } from "@/api/api-client";
import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/components/loading";
import { PostsList } from "@/components/posts/posts-list";
import { Divider } from "@heroui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function CategoryPageClient() {
  const { id: category } = useParams<{ id: string }>();
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  const PAGE_SIZE = 24;

  const query = useInfiniteQuery({
    queryKey: ["getPostsByUserName", category],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.posts.getPostsByTag({
        tag: category,
        offset: pageParam,
      });
      return response;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined,
    initialPageParam: 0,
    enabled: !!category,
  });

  if (query.isLoading) {
    return <Loading />;
  }

  if (query.error) {
    return <ErrorMessage />;
  }

  return (
    query.data && (
      <div className="layout-page">
        <div className="layout-page-content">
          {query.data?.pages?.flat && (
            <PostsList
              query={query}
              posts={query.data?.pages?.flat()}
              hideCategory
            />
          )}
        </div>

        <div className="layout-page-aside hidden">
          <Divider
            className="layout-page-aside-divider"
            orientation="vertical"
          />

          <div className="layout-page-aside-content">
            <aside className="layout-page-aside-content-sticky">
              <h3 className="text-lg font-semibold">{categoryName}</h3>
              <p>
                Discover a wide range of posts related to{" "}
                <strong>{categoryName}</strong>. Stay tuned for more updates and
                happy reading!
              </p>
            </aside>
          </div>
        </div>
      </div>
    )
  );
}
