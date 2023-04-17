import ErrorMessage from "@/components/ErrorMessages/ErrorMessage";
import Loading from "@/components/loading";
import { PostFull } from "@/components/post/PostFull";
import { IPost } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import { delay } from "@/utils/utils";
import axios from "axios";
import { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/dist/client/router";
import Head from "next/head";
import { useEffect } from "react";
import useSWR from "swr";

interface IProps {
  fallback: IPost;
}

export default function Post({ fallback }: IProps) {
  const { data: auth }: any = useSession();
  const router = useRouter();
  const { post } = router.query;

  const { data, error, isLoading } = useSWR<IPost>(
    `${API_URL}/posts/${post}`,
    fetcher,
    {
      fallbackData: fallback,
    }
  );

  const postCounter = async () => {
    await delay(10);

    if (data?.author?.id != auth?.user.id) {
      await axios.put(`${API_URL}/posts/${fallback.id}/count-view`);
    }
  };

  useEffect(() => {
    postCounter();
  }, [data?.id]);

  if (error || data?.code)
    return <ErrorMessage code={error?.response?.data?.code} />;

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
  const res = await fetch(`${API_URL}/posts/${post}`);
  const fallback = await res.json();

  return { props: { fallback } };
}
