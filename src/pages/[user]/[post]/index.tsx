"use client";

import { PostDetailedResponse } from "@/shared/api/openapi";
import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/shared/ui/loading";
import { PostView } from "@/components/posts/post-view";
import { usePostBySlug } from "@/features/user/model/use-post-by-slug";
import usePostViews from "@/features/user/model/use-post-views";
import { GetServerSideProps } from "next";
import { getPostBySlugSSR } from "@/features/posts/model/get-post-by-slug.ssr";
import { GenerateMeta } from "@/shared/lib/head/meta-data";

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { post: slug } = params as { post: string };
  const postServer = await getPostBySlugSSR(slug);
  return {
    props: postServer,
  };
};

export default function PostClient(post: PostDetailedResponse) {
  const { data, error, isLoading } = usePostBySlug(post.slug);

  usePostViews(data?.id || "", data?.author?.id || "");

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <>
      <GenerateMeta
        title={post?.title}
        description={post?.summary || post?.body?.substring(0, 100) || ""}
        url={post?.author ? `/${post.author.userName}/${post.slug}` : ""}
        image={post?.coverUrl ? post.coverUrl : undefined}
        type="article"
      />

      <PostView post={data} />
    </>
  );
}
