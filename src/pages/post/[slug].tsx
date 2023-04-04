import ErrorMessage from "@/components/errorMessage";
import { PostFull } from "@/components/post/PostFull";
import { API_URL, fetcher } from "@/services/apiService";
import { IPostFull } from "@/types";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import useSWR from 'swr';

interface IProps {
  fallback: IPostFull;
}

// Component

const Post = ({ fallback }: IProps) => {
  const router = useRouter();
  const { slug } = router.query;

  const { data } = useSWR<IPostFull>(`${API_URL}/posts/${slug}`, fetcher, {fallbackData: fallback,});
  
  if (!data) return <div>Loading...</div>;

  if (data.code) {
    return <ErrorMessage code={data.code}></ErrorMessage>
  }

  return <PostFull post={data} />;
};

export default Post;

export async function getServerSideProps(context: GetServerSidePropsContext) {

  const slug = context.params?.slug;
  const res = await fetch(`${API_URL}/posts/${slug}`);

  // if(!res.ok) {
  //   return {
  //     redirect: {
  //       destination: "/not-found",
  //       permanent: false,
  //     },
  //   };
  // }

  const fallback = await res.json();
  return { props: { fallback } };

}
