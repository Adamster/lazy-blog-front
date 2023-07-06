import ErrorMessage from "@/components/eerrorMessages/ErrorMessage";
import Loading from "@/components/loading";
import PostPreview from "@/components/post/PostPreview";
import { IPost, IPosts } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import Head from "next/head";
import useSWR from "swr";

export default function Home() {
  const { data, error, isLoading, mutate } = useSWR<IPosts>(
    `${API_URL}/posts`,
    fetcher
  );

  if (error || data?.code) return <ErrorMessage code={data?.code || ""} />;

  return (
    <>
      <Head>
        <title>Посты | Not Lazy Blog</title>
        <meta
          key="og:title"
          property="og:title"
          content="Посты | Not Lazy Blog"
        />
      </Head>

      {isLoading && <Loading />}

      <h2 className="text-2xl text-center font-bold mb-8">Recent posts</h2>

      <div className="postsGridFirst mb-8">
        {data &&
          data.map((post: IPost, index) => {
            if (index < 2)
              return (
                <PostPreview
                  key={post.id}
                  post={post}
                  author={post.author}
                  mutate={mutate}
                ></PostPreview>
              );
          })}
      </div>

      <h2 className="text-2xl text-center font-bold mb-8">All posts</h2>

      <div className="postsGrid">
        {data &&
          data.map((post: IPost, index) => {
            if (index > 2)
              return (
                <PostPreview
                  key={post.id}
                  post={post}
                  author={post.author}
                  mutate={mutate}
                ></PostPreview>
              );
          })}
      </div>
    </>
  );
}
