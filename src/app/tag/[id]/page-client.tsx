"use client";

import { apiClient } from "@/api/api-client";
import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/components/loading";
import { PostsList } from "@/components/posts/posts-list";
import { PAGE_SIZE } from "@/utils/consts";
import { snakeToTitle } from "@/utils/utils";
import { Divider } from "@heroui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function TagPageClient() {
  const { id: tag } = useParams<{ id: string }>();
  const tagName = snakeToTitle(tag);

  const query = useInfiniteQuery({
    queryKey: ["getPostsByTag", tag],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.posts.getPostsByTag({
        tag: tag.replace(/_/g, " "),
        offset: pageParam,
      });
      return response;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined,
    initialPageParam: 0,
    enabled: !!tag,
  });

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  return (
    query.data && (
      <div className="layout-page">
        <div className="layout-page-content">
          {query.data?.pages?.flat().length > 0 ? (
            <PostsList
              query={query}
              posts={query.data?.pages?.flat()}
              hideTags
            />
          ) : (
            <p>Still waiting for someone to break the silence!</p>
          )}
        </div>

        <div className="layout-page-aside hidden">
          <Divider
            className="layout-page-aside-divider"
            orientation="vertical"
          />

          <div className="layout-page-aside-content">
            <aside className="layout-page-aside-content-sticky">
              <h3 className="text-lg font-semibold">{tagName}</h3>
              <p>
                Discover a wide range of posts related to{" "}
                <strong>{tagName}</strong>. Stay tuned for more updates and
                happy reading!
              </p>
            </aside>
          </div>
        </div>
      </div>
    )
  );
}
