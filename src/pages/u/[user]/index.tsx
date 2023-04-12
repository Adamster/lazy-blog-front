import ErrorMessage from "@/components/ErrorMessages/ErrorMessage";
import Loading from "@/components/loading";
import PostPreview from "@/components/post/PostPreview";
import { UserDetails } from "@/components/user/UserDetails";
import { IPost, IUserDetails } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import useSWR from "swr";

interface IProps {
  fallback: IUserDetails;
}

//Component
export default function User() {
  const router = useRouter();
  const { user } = router.query;
  const { data: auth }: any = useSession();

  const { data, error, isLoading } = useSWR<IUserDetails>(
    user ? `${API_URL}/posts/${user}/posts` : null,
    fetcher
  );

  if (error || data?.code)
    return <ErrorMessage code={error?.response?.data?.code} />;

  return (
    <>
      <Head>
        <title>{data?.user.userName} | Not Lazy Blog</title>
        <meta property="og:title" content={data?.user.userName} />
      </Head>

      {isLoading && <Loading />}

      <UserDetails
        user={data?.user}
        authUserId={auth?.user.id}
        postsNum={data?.postItems?.length}
      />

      {data?.postItems &&
        data.postItems.map((post: IPost) => (
          <PostPreview
            key={post.id}
            post={post}
            author={data.user}
            authUserId={auth?.user.id}
          ></PostPreview>
        ))}
    </>
  );
}

// export async function getServerSideProps(context: GetServerSidePropsContext) {
//   const user = context.params?.username;
//   const res = await fetch(`${API_URL}/posts/${user}/posts`);
//   const fallback = await res.json();

//   return { props: { fallback } };
// }
