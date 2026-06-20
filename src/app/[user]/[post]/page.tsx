import { notFound } from "next/navigation";
import { PostDetailedResponse } from "@/shared/api/openapi";
import { generateMeta } from "@/shared/lib/head/meta-data";
import { Header } from "@/widgets/header";
import { PostView } from "@/features/post/ui/post-view";
import { PostHeaderMenuIsland } from "@/features/post/ui/post-header-menu-island";
import { PostVoteIsland } from "@/features/post/ui/post-vote-island";
import { getPostSSR } from "@/features/post/model/get-post.ssr";
import { PostComments } from "./post-comments";
import { PostCommentsCount } from "./post-comments-count";

type PageProps = {
  params: Promise<{ user: string; post: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { post: slug } = await params;
  const postData: PostDetailedResponse | null = await getPostSSR(slug);

  if (postData) {
    return generateMeta({
      title: postData.title,
      description: postData?.summary || postData?.body?.substring(0, 100) || "",
      image: postData.coverUrl || undefined,
      type: "article",
      url: `/${postData.author.userName}/${postData.slug}`,
    });
  }

  return generateMeta({
    title: "Not Found",
  });
}

export default async function Page({ params }: PageProps) {
  const { post: slug } = await params;

  const postData: PostDetailedResponse | null = await getPostSSR(slug);
  if (!postData) notFound();

  const authorHandle = postData.author.userName ?? "";

  // Composition root: the article (title / summary / byline / body) is
  // server-rendered for SEO; the interactive pieces — author kebab, vote band,
  // comments — are client islands slotted into the server tree.
  return (
    <div
      className="mono-scope mx-[calc(50%-50vw)] min-h-screen w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <Header />
      <PostView
        post={postData}
        commentsCount={<PostCommentsCount postId={postData.id} />}
        headerMenu={
          <PostHeaderMenuIsland
            postId={postData.id}
            postSlug={postData.slug}
            authorId={postData.author.id ?? ""}
            authorHandle={authorHandle}
            isPublished={postData.isPublished}
          />
        }
        vote={
          <PostVoteIsland
            postId={postData.id}
            postSlug={postData.slug}
            authorId={postData.author.id ?? ""}
            voteDirection={postData.voteDirection}
            rating={postData.rating}
          />
        }
        comments={
          <PostComments
            postId={postData.id}
            isPostPublished={postData.isPublished}
          />
        }
      />
    </div>
  );
}
