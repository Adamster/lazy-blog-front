import ErrorMessage from "@/components/eerrorMessages/ErrorMessage";
import Loading from "@/components/loading";
import { PostFull } from "@/components/post/PostFull";
import { IPost } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import { delay } from "@/utils/utils";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/dist/client/router";
import Head from "next/head";
import { useEffect } from "react";
import useSWR from "swr";

interface IProps {
  fallback: IPost;
}

function Post({ fallback }: IProps) {
  const { data: auth }: any = useSession();

  const router = useRouter();
  const { post } = router.query;

  const { data, error, isLoading, mutate } = useSWR<IPost>(
    post ? `${API_URL}/posts/${post}` : "",
    fetcher,
    {
      fallbackData: fallback,
    }
  );

  const postViewCounter = async () => {
    await delay(10);

    if (data?.author?.id != auth?.user.id) {
      await axios.put(`${API_URL}/posts/${data?.id}/count-view`);
    }
  };

  useEffect(() => {
    if (data?.id) {
      postViewCounter();
    }
  }, [data?.id]);

  if (data?.code) return <ErrorMessage code={data.code} />;

  return (
    <>
      <Head>
        <title>{`${data?.title} | Not Lazy Blog`}</title>
        <meta key="og:title" property="og:title" content={data?.title} />
        <meta
          key="description"
          name="description"
          content={data?.summary || data?.body?.substring(0, 20)}
        />
        <meta
          key="og:description"
          property="og:description"
          content={data?.summary || data?.body?.substring(0, 20)}
        />
        <meta key="og:image" property="og:image" content={data?.coverUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={data?.coverUrl} />
      </Head>

      {isLoading && <Loading />}

      {data?.id && <PostFull post={data} mutate={mutate} />}
    </>
  );
}

Post.getInitialProps = async (ctx: any) => {
  if (!ctx.req) {
    return { fallback: undefined };
  }

  const res = await fetch(`${API_URL}/posts/${ctx.query.post}`);
  const fallback = await res.json();

  return { fallback };
};

export default Post;
