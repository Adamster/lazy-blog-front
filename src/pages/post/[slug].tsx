import { useRouter } from "next/router";
import { IPostFull } from "types";

interface IProps {
  data: IPostFull;
}

const apiUrl = process.env.NEXT_PUBLIC_API;

// export async function getServerSideProps(
//   context: GetServerSidePropsContext
// ): Promise<{ props: IProps | null }> {
//   try {
//     const slug = context.params?.slug;
//     const res = await fetch(`${apiUrl}/posts/${slug}`);

//     if (!res.ok) {
//       throw new Error(`Failed to fetch data for slug: ${slug}`);
//     }

//     const data = await res.json();
//     return { props: { data } };
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return { props: null };
//   }
// }

// Component

const Post = ({ data }: IProps) => {
  const router = useRouter();
  const { slug } = router.query;

  // return <PostFull post={data} />;
  return <>hopa</>;
};

export default Post;
