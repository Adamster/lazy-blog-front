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

      {/* <h2 className="text-2xl mb-8">Recent blog posts</h2> */}

      <div className="postsList">
        {data &&
          data.map((post: IPost) => (
            <PostPreview
              key={post.id}
              post={post}
              author={post.author}
              mutate={mutate}
            ></PostPreview>
          ))}
      </div>
    </>
  );
}
