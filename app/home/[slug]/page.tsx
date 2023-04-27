import { IPost } from "@/types";
import { PostFull } from "components/post/PostFull";

interface IProps {
  fallback: IPost;
  params: { slug: string };
}

function Post({ params }: IProps) {
  return <PostFull slug={params.slug} />;
}

export default Post;
