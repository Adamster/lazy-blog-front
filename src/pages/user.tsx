import { API_URL, fetcher } from "@/services/apiService";
import { IPost } from "@/types";
import Head from "next/head";
import useSWR from "swr";

interface IProps {
  fallbackData: IPost[];
}

// const apiUrl = process.env.NEXT_PUBLIC_API;

// Component

export default function Home({ fallbackData }: IProps) {
  // const { data: session } = useSession();

  const { data, error } = useSWR<IPost[]>(`${API_URL}/posts`, fetcher, {
    fallbackData: fallbackData,
  });

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <Head>
        <title>Юзверь | Not Lazy Blog</title>
      </Head>

      <div>
        Тут будет инфа по юзеру
      </div>

      {/* {data &&
        data.map((post: IPost) => (
          <PostPreview key={post.id} post={post}></PostPreview>
        ))} */}
    </>
  );
}
