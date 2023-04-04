import ErrorMessage from "@/components/errorMessage";
import Loading from "@/components/loading";
import { PostFull } from "@/components/post/PostFull";
import { IPost } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import useSWR from "swr";

interface IProps {
  fallback: IPost;
}

// Component

const Post = ({ fallback }: IProps) => {
  const router = useRouter();
  const { slug } = router.query;

  const { data, error, isLoading } = useSWR<IPost>(
    `${API_URL}/posts/${slug}`,
    fetcher,
    {
      fallbackData: fallback,
    }
  );

  if (error || data?.code) return <ErrorMessage code={data?.code && ""} />;
  if (isLoading) return <Loading />;

  return (
    <>
      <Head>
        <title>{data?.title} | Not Lazy Blog</title>
        <meta property="og:title" content={data?.title} />
        <meta
          name="description"
          content={data?.summary || data?.body.substring(0, 20)}
        />
        <meta
          property="og:description"
          content={data?.summary || data?.body.substring(0, 20)}
        />
      </Head>

      {data && <PostFull post={fallback} />}
    </>
  );
};

export default Post;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const slug = context.params?.slug;
  const res = await fetch(`${API_URL}/posts/${slug}`);
  const fallback = await res.json();

  return { props: { fallback } };
}
