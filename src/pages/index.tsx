import ErrorMessage from "@/components/error-message";
import Loading from "@/components/loading";
import PostPreview from "@/components/post";
import { IPost, IPosts } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import Head from "next/head";
import useSWR from "swr";

export default function Home() {
  const { data, error, isLoading } = useSWR<IPosts>(
    `${API_URL}/posts`,
    fetcher
  );

  if (error || data?.code) return <ErrorMessage code={data?.code && ""} />;

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

      {data &&
        data.map((post: IPost) => (
          <PostPreview key={post.id} post={post}></PostPreview>
        ))}
    </>
  );
}
