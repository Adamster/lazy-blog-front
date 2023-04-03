import { PostFull } from "@/components/post/PostFull";
import { API_URL } from "@/services/apiService";
import { IPostFull } from "@/types";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

interface IProps {
  data: IPostFull;
}

// Component

const Post = ({ data }: IProps) => {
  const router = useRouter();
  const { slug } = router.query;
  return <PostFull post={data} />;
};

export default Post;

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<{ props: IProps | null }> {
  try {
    const slug = context.params?.slug;
    const res = await fetch(`${API_URL}/posts/${slug}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch data for slug: ${slug}`);
    }

    const data = await res.json();
    return { props: { data } };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { props: null };
  }
}
