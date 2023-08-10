import ErrorMessage from "@/components/eerrorMessages/ErrorMessage";
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

export default function User() {
  const router = useRouter();
  const { user } = router.query;
  const { data: auth } = useSession();

  const { data, error, isLoading, mutate } = useSWR<IUserDetails>(
    user ? `${API_URL}/posts/${user}/posts` : null,
    fetcher
  );

  if (error || data?.code)
    return <ErrorMessage code={error?.response?.data?.code} />;

  return (
    <>
      <Head>
        <title>
          {data?.user.firstName + " " + data?.user.lastName} | Not Lazy Blog
        </title>
        <meta
          property="og:title"
          content={data?.user.firstName + " " + data?.user.lastName}
        />
      </Head>

      {isLoading && <Loading />}

      <div className="wrapper p-8">
        <div className="mb-8">
          <UserDetails
            user={data?.user}
            authUserId={auth?.user.id}
            postsNum={data?.postItems?.length}
          />
        </div>

        <div className="postsGrid">
          {data?.postItems &&
            data.postItems.map((post: IPost) => (
              <PostPreview
                key={post.id}
                post={post}
                author={data.user}
                mutate={mutate}
              ></PostPreview>
            ))}

          {data?.postItems && !data?.postItems.length && (
            <p className="text-center">Нет постов</p>
          )}
        </div>
      </div>
    </>
  );
}
