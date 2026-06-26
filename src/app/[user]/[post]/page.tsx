import { notFound } from "next/navigation";
import { generateMeta } from "@/shared/lib/head/meta-data";
import { JsonLd } from "@/shared/lib/head/json-ld";
import { getPostMeta } from "@/features/post/model/get-post-meta";
import { buildPostJsonLd } from "@/features/post/lib/post-jsonld";
import { PostPageBody } from "./post-page-body";

type PageProps = {
  params: Promise<{ user: string; post: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { post: slug } = await params;
  const postData = await getPostMeta(slug);

  // Never surface a draft's title/summary/body in public OG/meta — defence in
  // depth even if the (unauthenticated) backend ever returns an unpublished post.
  if (postData && postData.isPublished) {
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
  const { user, post: slug } = await params;

  // META-ONLY server fetch (title / OG / JSON-LD), uncached — the page BODY
  // loads client-side (authenticated), so vote state and view counts are live
  // with no SSR/ISR staleness. A missing slug still returns a real 404.
  const postData = await getPostMeta(slug);
  // Treat a draft exactly like a missing post for anonymous SSR: no 404-able
  // route to a draft, and the public JSON-LD `articleBody` below never leaks.
  if (!postData || !postData.isPublished) notFound();

  const url = `/${postData.author.userName ?? user}/${postData.slug}`;

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <JsonLd data={buildPostJsonLd(postData, url)} />
      <PostPageBody slug={slug} />
    </div>
  );
}
