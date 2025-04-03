"use client";

import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { Divider } from "@heroui/react";
import { PostsList } from "@/features/post/ui/posts-list";
import { useAllPosts } from "@/features/post/model/use-all-posts";
import { TagsList } from "@/features/tag/ui/tags-list";

export default function HomePage() {
  const query = useAllPosts();

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  return (
    <>
      <div className="layout-page">
        <div className="layout-page-content">
          <PostsList query={query} posts={query.data?.pages?.flat() || []} />
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-wrapper">
            <aside className="layout-page-aside-sticky">
              <div className="overflow-auto max-w-full">
                <div className="flex md:flex-col mb-1 md:mb-0 whitespace-nowrap gap-1">
                  <TagsList />
                </div>
              </div>
            </aside>
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    </>
  );
}
