import ErrorMessage from "@/components/error-message";
import Loading from "@/components/loading";
import { IUser, IUserPostDetails } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import useSWR from "swr";

interface IProps {
  fallback: IUser;
}

//Component
const User = ({ fallback }: IProps) => {
  const router = useRouter();
  const { user } = router.query;

  const { data, error, isLoading } = useSWR<IUserPostDetails>(
    `${API_URL}/posts/${user}/posts`,
    fetcher,
    {
      fallbackData: fallback,
    }
  );

  if (error || data?.code) return <ErrorMessage code={data?.code || ""} />;

  return (
    <>
      <Head>
        <title>{data?.user.userName} | Not Lazy Blog</title>
        <meta property="og:title" content={data?.user.userName} />
        {/* <meta name="description" content={data?.user.email} /> */}
      </Head>

      {isLoading && <Loading />}

      {/* 
      {data && data.user && (
        <UserDetails key={data.user.id} user={data.user}></UserDetails>
      )}

      {data &&
        data.postItems &&
        data.postItems.map((post: IPostItem) => (
          <PostItem key={post.postId} post={post}></PostItem>
        ))} */}

      {data?.user && (
        <div className={classNames("mb-4")}>
          <h1 className="text-3xl font-bold">{`${data?.user.firstName} ${data?.user.lastName}`}</h1>
          <p>страница еще в разработке</p>
        </div>
      )}

      {/* {data?.postItems &&
        data.postItems.map((post: IPost) => (
          <PostPreview key={post.id} post={post}></PostPreview>
        ))} */}
    </>
  );
};

export default User;

// export async function getServerSideProps(context: GetServerSidePropsContext) {
//   const user = context.params?.username;
//   const res = await fetch(`${API_URL}/posts/${user}/posts`);
//   const fallback = await res.json();

//   return { props: { fallback } };
// }
