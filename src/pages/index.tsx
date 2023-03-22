import PostPreview from "@/components/post";
import { API_URL, fetcher, getPosts } from "@/services/apiService";
import { IPost } from "@/types";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import useSWR from "swr";

interface IProps {
  fallbackData: IPost[];
}

// const apiUrl = process.env.NEXT_PUBLIC_API;

// Component

export default function Home({ fallbackData }: IProps) {
  const { data: session } = useSession();

  const { data, error } = useSWR<IPost[]>(`${API_URL}/posts`, fetcher, {
    fallbackData: fallbackData,
  });

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <Head>
        <title>Посты | NotLazy Blog</title>
      </Head>

      {data &&
        data.map((post: IPost) => (
          <PostPreview key={post.id} post={post}></PostPreview>
        ))}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<IProps> = async ({
  res,
}) => {
  // This value is considered fresh for ten seconds (s-maxage=10).
  // If a request is repeated within the next 10 seconds, the previously
  // cached value will still be fresh. If the request is repeated before 59 seconds,
  // the cached value will be stale but still render (stale-while-revalidate=59).
  //
  // In the background, a revalidation request will be made to populate the cache
  // with a fresh value. If you refresh the page, you will see the new value.
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=10, stale-while-revalidate=59"
  );

  const fallbackData = await getPosts();
  return { props: { fallbackData } };
};
