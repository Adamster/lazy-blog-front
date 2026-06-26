import Image from "next/image";
import Link from "next/link";
import { DisplayPostResponse, UserPostItem } from "@/shared/api/openapi";
import { Category, Metric, DraftOverlay } from "@/shared/ui";
import { formatDate2 } from "@/shared/lib/utils";
import { UNTAGGED_LABEL } from "../lib/untagged-label";

/** Feed row shared by the home feed (`DisplayPostResponse`) and a user's
 *  profile feed (`UserPostItem`) — the two models share every card field. */
type FeedPost = DisplayPostResponse | UserPostItem;

interface PostCardMonoProps {
  post: FeedPost;
  /** Post permalink (`/{author}/{slug}`). */
  href: string;
  /** `@handle` to link above the meta row. Omitted on a user's own profile feed
   *  where the author is implicit. */
  authorHandle?: string;
}

const catOf = (p: FeedPost) => p.tags?.[0]?.tag ?? UNTAGGED_LABEL;

// First letter/digit of a title (skips punctuation) for the no-cover fallback.
const firstLetter = (s?: string) =>
  (s?.match(/[\p{L}\p{N}]/u)?.[0] ?? "•").toUpperCase();

function Cover({ post }: { post: FeedPost }) {
  if (post.coverUrl) {
    return (
      <Image
        src={post.coverUrl}
        alt={post.title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        unoptimized
        className="object-cover [filter:contrast(1.03)]"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--m-panel)]">
      <span className="font-display text-[46px] font-bold text-[var(--m-accent)] select-none">
        {firstLetter(post.title)}
      </span>
    </div>
  );
}

/** Author `@handle` link + the metrics cluster shown in the card footer. */
function CardMeta({
  post,
  authorHandle,
}: {
  post: FeedPost;
  authorHandle?: string;
}) {
  return (
    <>
      {authorHandle ? (
        <Link
          href={`/${authorHandle}`}
          className="relative z-[var(--m-z-content)] truncate text-[var(--m-muted)] transition-colors hover:text-[var(--m-accent)]"
        >
          @{authorHandle}
        </Link>
      ) : (
        <span className="truncate">{formatDate2(post.createdAtUtc)}</span>
      )}
      <span className="ml-auto flex items-center gap-4">
        <Metric kind="views" value={post.views} />
        <Metric kind="comments" value={post.comments} />
        <Metric kind="rating" value={post.rating} />
      </span>
    </>
  );
}

/**
 * The single source-of-truth feed card for the home + profile feeds. Built to
 * the Brutalist-Mono feed spec: flush cover, `p-5` (20px) content, `[ category ]`
 * → 18px `mono-title` (`mb-2`), and a Caption-12 meta footer using the shared
 * `Metric` / `Dot` primitives. Renders the vertical grid card.
 */
export function PostCard({ post, href, authorHandle }: PostCardMonoProps) {
  return (
    <article className="group relative flex h-full flex-col bg-[var(--m-card)] transition-colors hover:bg-[var(--m-panel)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--m-panel)]">
        <Cover post={post} />
        {/* Draft cover overlay — only the author's own profile feed shows
            drafts. `pointerThrough` lets clicks fall to the stretched title
            link, so the cover stays a post link like a published card. */}
        {!post.isPublished && <DraftOverlay size="card" pointerThrough />}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2">
          <Category>{catOf(post)}</Category>
        </div>
        <h3 className="mono-title text-balance transition-colors group-hover:text-[var(--m-accent)]">
          <Link href={href} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <div className="mt-auto flex items-center gap-4 pt-6 text-[12px] text-[var(--m-muted)]">
          <CardMeta post={post} authorHandle={authorHandle} />
        </div>
      </div>
    </article>
  );
}
