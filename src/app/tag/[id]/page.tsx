import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { generateMeta } from "@/shared/lib/head/meta-data";
import TagPage from "./tag-page";
import { snakeToTitle } from "@/shared/lib/utils";
import { getPostsByTagSSR } from "@/features/post/model/get-posts-by-tag.ssr";
import { postKeys } from "@/features/post/model/post-keys";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id: tag } = await params;
  const tagName = snakeToTitle(tag);

  return generateMeta({
    title: `${tagName} Tag`,
    description: `A collection of posts related to the '${tagName}' topic.`,
    url: `/tag/${tag}`,
  });
}

export default async function Page({ params }: PageProps) {
  const { id: tag } = await params;

  // SSR-seed the first feed page under the SAME key `usePostsByTag` reads (the
  // raw route param), so the tag route ships crawlable content and the client
  // hydrates without a refetch.
  const posts = await getPostsByTagSSR(tag);

  const queryClient = new QueryClient();
  queryClient.setQueryData(postKeys.byTag(tag), {
    pages: [posts],
    pageParams: [0],
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TagPage tag={tag} />
    </HydrationBoundary>
  );
}
