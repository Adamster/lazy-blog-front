/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/api/api-client";
import { PageProps } from "../../../../.next/types/app/layout";
import PostClient from "./postClient";

export async function generateMetadata({ params }: PageProps) {
  try {
    const postSlug = (params as any).post;
    const post = await apiClient.posts.apiPostsSlugGet({ slug: postSlug });

    return {
      title: `${post?.title} | !LAZY Blog`,
      description: post?.summary || post?.body?.substring(0, 100) || "",
      openGraph: {
        title: post?.title,
        description: post?.summary || post?.body?.substring(0, 100),
        images: [{ url: post?.coverUrl }],
      },
      twitter: {
        card: "summary_large_image",
        title: post?.title,
        description: post?.summary || post?.body?.substring(0, 100),
        images: [post?.coverUrl],
      },
    };
  } catch {
    return {
      title: "Not Found | !LAZY Blog",
      description: "Пост не найден",
    };
  }
}

export default function Post({ params }: PageProps) {
  return <PostClient postSlug={(params as any).post} />;
}
