"use client";

import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { snakeToTitle } from "@/shared/lib/utils";
import { Divider } from "@heroui/react";
import { PostsList } from "@/features/post/ui/posts-list";
import { usePostsByTag } from "@/features/post/model/use-posts-by-tag";

export default function TagPage({ tag }: { tag: string }) {
  const tagName = snakeToTitle(tag);
  const query = usePostsByTag(tag);
  const posts = query.data?.pages?.flat() ?? [];

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  return (
    <div className="layout-page">
      <div className="layout-page-content">
        <PostsList query={query} posts={posts} hideTags />
      </div>

      <div className="layout-page-aside">
        <Divider className="layout-page-divider" orientation="vertical" />

        <div className="layout-page-aside-content">
          <aside className="layout-page-aside-content-sticky">
            <h3 className="text-lg font-semibold">{tagName}</h3>
            <p>
              Looking for something interesting? You’re in the right place. Dive
              in before your coffee gets cold.
            </p>
          </aside>
        </div>

        <Divider className="layout-page-divider-mobile" />
      </div>
    </div>
  );
}
