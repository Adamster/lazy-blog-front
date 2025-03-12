/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateMeta } from "@/components/meta/meta-data";
import PostClient from "./page-client";

const getPostData = async (slug: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/api/posts/${slug}`,
    {
      cache: "no-store",
    }
  );
  if (!response.ok) return null;
  return response.json();
};

export async function generateMetadata({ params }: { params: any }) {
  const { post } = await params;
  const postData = await getPostData(post);

  return generateMeta({
    title: postData?.title || "Not Found",
    description: postData?.summary || postData?.body?.substring(0, 100) || null,
    image: postData?.coverUrl || null,
    type: "article",
  });
}

export default async function Post({ params }: any) {
  const { post } = await params;
  const postData = await getPostData(post);

  return <PostClient post={postData} />;
}
