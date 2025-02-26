/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateMeta } from "@/components/meta/meta-data";
import PostClient from "./page-client";

export async function generateMetadata({ params }: any) {
  try {
    const { user, post } = await params;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/api/posts/${post}`
    );
    const postData: any = await response.json();

    return generateMeta({
      title: postData.title,
      description: postData.summary || postData.body?.substring(0, 100),
      image: postData.coverUrl || null,
      url: `${user}/${post}`,
    });
  } catch {
    return {
      title: "Not Found | !LAZY Blog",
    };
  }
}

export default function Post() {
  return <PostClient />;
}
