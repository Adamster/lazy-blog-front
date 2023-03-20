import PostPreview from "@/components/post";
import Head from "next/head";
import useSWR from "swr";
import { IPost } from "types";

interface IProps {
  initialData: IPost[];
}

const apiUrl = process.env.NEXT_PUBLIC_API;

const fetcher = (url: string): Promise<IPost[]> =>
  fetch(url).then((res) => res.json());

export async function getServerSideProps(): Promise<{ props: IProps }> {
  const initialData = await fetcher(`${apiUrl}/posts`);
  return { props: { initialData } };
}

// Component

export default function Home({ initialData }: IProps) {
  const { data, error } = useSWR(`${apiUrl}/posts`, fetcher);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <Head>
        <title>Посты | NotLazy Blog</title>
      </Head>

      {initialData &&
        initialData.map((post: IPost) => (
          <PostPreview key={post.id} post={post}></PostPreview>
        ))}
    </>
  );
}
