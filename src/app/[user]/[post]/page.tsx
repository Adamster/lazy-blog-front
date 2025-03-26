/* eslint-disable @typescript-eslint/no-explicit-any */
import { PostDetailedResponse } from "@/shared/api/openapi";
import { generateMeta } from "@/shared/lib/head/meta-data";
import PostPage from "./post-page";
import { getPostSSR } from "@/features/posts/model/get-post.ssr";

export async function generateMetadata({ params }: any) {
  const { post: slug } = await params;
  const postData: PostDetailedResponse = await getPostSSR(slug);

  if (postData) {
    return generateMeta({
      title: postData.title,
      description: postData?.summary || postData?.body?.substring(0, 100) || "",
      image: postData.coverUrl || undefined,
      type: "article",
      url: `/${postData.author.userName}/${postData.slug}`,
    });
  } else {
    return generateMeta({
      title: "Not Found",
    });
  }
}

export default function Page({ params }: { params: { post: string } }) {
  const { post: slug } = params;
  return <PostPage slug={slug} />;
}
