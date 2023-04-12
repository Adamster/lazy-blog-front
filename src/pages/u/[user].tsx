import ErrorMessage from "@/components/ErrorMessages/ErrorMessage";
import Loading from "@/components/loading";
import PostPreview from "@/components/post";
import { IPost, IUserDetails } from "@/types";
import { API_URL, fetcher } from "@/utils/fetcher";
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import useSWR from "swr";

interface IProps {
  fallback: IUserDetails;
}

//Component
const User = ({ fallback }: IProps) => {
  const router = useRouter();
  const { user } = router.query;

  const { data, error, isLoading } = useSWR<IUserDetails>(
    `${API_URL}/posts/${user}/posts`,
    fetcher
    // {
    //   fallbackData: fallback,
    // }
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

      {data?.user && (
        <div className={classNames("mb-4")}>
          <h1 className="text-3xl font-bold">{`${data?.user.firstName} ${data?.user.lastName}`}</h1>
          <p>Лучшие статьи</p>
        </div>
      )}

      {data?.postItems &&
        data.postItems.map((post: IPost) => (
          <PostPreview
            key={post.id}
            post={post}
            author={data.user}
          ></PostPreview>
        ))}
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