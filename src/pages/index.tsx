import PostPreview from "@/components/post";
import { API_URL, fetcher, getPosts } from "@/services/apiService";
import { IPost } from "@/types";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect } from "react";
import useSWR from "swr";

interface IProps {
  fallbackData: IPost[];
}

// const apiUrl = process.env.NEXT_PUBLIC_API;

// Component

export default function Home({ fallbackData }: IProps) {
  const { data: session } = useSession();

  useEffect(() => {
    console.log(session);
  }, []);

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

export const getServerSideProps: GetServerSideProps<IProps> = async () => {
  const fallbackData = await getPosts();
  return { props: { fallbackData } };
};
