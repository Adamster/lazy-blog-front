import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { PostDetailedResponse } from "@/shared/api/openapi";
import { generateMeta } from "@/shared/lib/head/meta-data";
import PostPage from "./post-page";
import { getPostSSR } from "@/features/post/model/get-post.ssr";

type PageProps = {
  params: Promise<{ user: string; post: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { post: slug } = await params;
  const postData: PostDetailedResponse | null = await getPostSSR(slug);

  if (postData) {
    return generateMeta({
      title: postData.title,
      description: postData?.summary || postData?.body?.substring(0, 100) || "",
      image: postData.coverUrl || undefined,
      type: "article",
      url: `/${postData.author.userName}/${postData.slug}`,
    });
  }

  return generateMeta({
    title: "Not Found",
  });
}

export default async function Page({ params }: PageProps) {
  const { post: slug } = await params;

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["getPostBySlug", slug],
    queryFn: () => getPostSSR(slug),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostPage slug={slug} />
    </HydrationBoundary>
  );
}
