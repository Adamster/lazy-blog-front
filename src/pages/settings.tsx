import Head from "next/head";

export default function Home() {
  // const { data, error, isLoading } = useSWR<IPosts>(
  //   `${API_URL}/posts`,
  //   fetcher
  // );

  // if (error || data?.code) return <ErrorMessage code={data?.code || ""} />;

  return (
    <>
      <Head>
        <title>Настройки | Not Lazy Blog</title>
      </Head>

      <div>Настройки будут когда-то тут</div>

      {/* {data &&
        data.map((post: IPost) => (
          <PostPreview key={post.id} post={post}></PostPreview>
        ))} */}
    </>
  );
}
