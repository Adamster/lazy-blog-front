import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/shared/ui/loading";
import { snakeToTitle } from "@/shared/lib/utils";
import { Divider } from "@heroui/react";
import { PostsList } from "@/features/posts/ui/posts-list";
import { usePostsByTag } from "@/features/tags/model/use-posts-by-tag";
import { GenerateMeta } from "@/shared/lib/head/meta-data";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { id } = params as { id: string };
  const tag = id.replace(/_/g, " ");

  return {
    props: {
      tag,
    },
  };
};

export default function TagPageClient({ tag }: { tag: string }) {
  const tagName = snakeToTitle(tag);
  const query = usePostsByTag(tag);
  const posts = query.data?.pages?.flat() ?? [];

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  return (
    <>
      <GenerateMeta
        title={tagName}
        description={`A collection of posts related to the '${tagName}' topic.`}
        url={`/tag/${tag}`}
      />

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
                Looking for something interesting? You’re in the right place.
                Dive in before your coffee gets cold.
              </p>
            </aside>
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    </>
  );
}
