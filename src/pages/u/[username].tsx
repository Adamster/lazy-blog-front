import ErrorMessage from "@/components/error-message";
import Loading from "@/components/loading";
import { PostItem } from "@/components/post/PostItem";
import { UserDetails } from "@/components/user/UserDetails";
import { IPostItem, IUserPostDetails } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import useSWR from "swr";

interface IProps {
  fallback: IUserPostDetails;
}

//Component
const User = ({ fallback }: IProps) => {
  const router = useRouter();
  const { username } = router.query;

  const { data, error, isLoading } = useSWR<IUserPostDetails>(
    `${API_URL}/posts/${username}/posts`,
    fetcher,
    {
      fallbackData: fallback,
    }
  );

  if (error || data?.code) return <ErrorMessage code={data?.code && ""} />;

  return (
    <>
      <Head>
        <title>{data?.user.userName} | Not Lazy Blog</title>
        <meta property="og:title" content={data?.user.userName} />
        <meta name="description" content={data?.user.email} />
      </Head>

      {isLoading && <Loading />}
      {data && data.user && (
        <UserDetails key={data.user.id} user={data.user}></UserDetails>
      )}

      {data &&
        data.postItems &&
        data.postItems.map((post: IPostItem) => (
          <PostItem key={post.postId} post={post}></PostItem>
        ))}
    </>
  );
};

export default User;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const user = context.params?.username;
  const res = await fetch(`${API_URL}/posts/${user}/posts`);
  const fallback = await res.json();

  return { props: { fallback } };
}
