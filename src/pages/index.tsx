import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/shared/ui/loading";
import { Divider } from "@heroui/react";
import { PostsList } from "@/features/posts/ui/posts-list";
import { useAllPosts } from "@/features/posts/model/use-all-posts";
import { TagsList } from "@/features/tags/ui/tags-list";
import Head from "next/head";
import { GenerateMeta } from "@/shared/lib/head/meta-data";

export default function Home() {
  const query = useAllPosts();

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  return (
    <>
      <Head>
        <title>Hm</title>
      </Head>

      <GenerateMeta />

      <div className="layout-page">
        <div className="layout-page-content">
          <PostsList query={query} posts={query.data?.pages?.flat() || []} />
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            <aside className="layout-page-aside-content-sticky">
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
