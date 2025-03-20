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
import { useMemo } from "react";

const categoryMessages = [
  "Welcome to the ultimate collection of posts on this topic. We promise it's more exciting than your last internet rabbit hole.",
  "Looking for something interesting? You’re in the right place. Dive in before your coffee gets cold.",
  "A carefully curated selection of posts just for you. Or at least that’s what we like to think.",
  "New posts, same great content. Unlike your fridge, this place always has something fresh.",
  "You’ve unlocked a treasure trove of posts. No map required, just your curiosity.",
  "This category has more content than your group chat on a Monday morning. Proceed with caution.",
  "You’re about to discover posts so good, you might forget why you came here in the first place.",
  "The content here is top-tier, but don’t just take our word for it. Read and judge for yourself.",
  "If scrolling through this page was an Olympic sport, you’d be a gold medalist by now. Keep going.",
  "Some say knowledge is power. We say reading these posts is at least a step in the right direction.",
];

export default function TagPageClient() {
  const { id: tag } = useParams<{ id: string }>();
  const tagName = snakeToTitle(tag);

  const randomMessage = useMemo(
    () => categoryMessages[Math.floor(Math.random() * categoryMessages.length)],
    []
  );

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

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            <aside className="layout-page-aside-content-sticky">
              <h3 className="text-lg font-semibold">{tagName}</h3>
              <p>{randomMessage}</p>
            </aside>
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    )
  );
}
