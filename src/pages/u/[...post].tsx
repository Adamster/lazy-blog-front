import ErrorMessage from "@/components/error-message";
import Loading from "@/components/loading";
import { PostFull } from "@/components/post/PostFull";
import { IPost } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/dist/client/router";
import Head from "next/head";
import useSWR from "swr";

interface IProps {
  fallback: IPost;
}

export default function Post({ fallback }: IProps) {
  const router = useRouter();
  const { post } = router.query;

  const { data, error, isLoading } = useSWR<IPost>(
    `${API_URL}/posts/${post![1]}`,
    fetcher,
    {
      fallbackData: fallback,
    }
  );

  if (error || data?.code) return <ErrorMessage code={data?.code || ""} />;

  return (
    <>
      <Head>
        <title>{`${fallback.title} | Not Lazy Blog`}</title>
        <meta key="og:title" property="og:title" content={fallback.title} />
        <meta
          key="description"
          name="description"
          content={fallback.summary || fallback.body.substring(0, 20)}
        />
        <meta
          key="og:description"
          property="og:description"
          content={fallback.summary || fallback.body.substring(0, 20)}
        />
        <meta key="og:image" property="og:image" content={fallback.coverUrl} />
      </Head>

      {isLoading && <Loading />}

      {data && <PostFull post={data} />}
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const post = context.params?.post;
  const res = await fetch(`${API_URL}/posts/${post![1]}`);
  const fallback = await res.json();
  return { props: { fallback } };
}
