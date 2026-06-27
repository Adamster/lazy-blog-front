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
  // loads client-side AUTHENTICATED (PostPageBody), so the AUTHOR can preview
  // their own unpublished draft and vote/view state stays live. This fetch is
  // ANONYMOUS, so a draft (or a not-yet-visible post) comes back null — we must
  // NOT notFound() on it, or we'd 404 the authenticated owner too. Access control
  // lives in the client fetch: a non-owner / missing slug gets a client-side
  // "Not Found" from PostPageBody. The JSON-LD below is gated to PUBLISHED, so a
  // draft's body never leaks to crawlers (generateMetadata is guarded the same way).
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
