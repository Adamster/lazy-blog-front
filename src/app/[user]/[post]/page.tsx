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

  // Never surface a draft's content in public OG/meta, even if the backend ever returns one.
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

  // Anonymous meta-only fetch — a draft comes back null, but we must NOT notFound()
  // on it or we'd 404 the authenticated owner previewing their own draft (access
  // control lives in PostPageBody's client fetch). JSON-LD below is gated to
  // published so a draft never leaks to crawlers.
  const postData = await getPostMeta(slug);
  const url = `/${postData?.author.userName ?? user}/${postData?.slug ?? slug}`;

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {postData?.isPublished && (
        <JsonLd data={buildPostJsonLd(postData, url)} />
      )}
      <PostPageBody slug={slug} />
    </div>
  );
}
