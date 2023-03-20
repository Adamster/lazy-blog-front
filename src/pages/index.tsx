import PostPreview from "@/components/post";
import { fetcher, getPosts } from "@/services/apiService";
import { IPost } from "@/types";
import { GetServerSideProps } from "next";
import Head from "next/head";
import useSWR from "swr";

interface IProps {
  fallbackData: IPost[];
}

const apiUrl = process.env.NEXT_PUBLIC_API;

export const getServerSideProps: GetServerSideProps<IProps> = async () => {
  const fallbackData = await getPosts();
  return { props: { fallbackData } };
};

// Component

export default function Home({ fallbackData }: IProps) {
  const { data, error } = useSWR<IPost[]>(`${apiUrl}/posts`, fetcher, {
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
