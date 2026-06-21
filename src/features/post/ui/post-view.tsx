import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/solid";
import { EyeSlashIcon } from "@heroicons/react/24/outline";
import { AuthorPostResponse, PostDetailedResponse } from "@/shared/api/openapi";
import { formatDate2 } from "@/shared/lib/utils";
import { Avatar, Category, PostBody, StatusBadge } from "@/shared/ui";
import type { Status } from "@/shared/ui";

interface IProps {
  post: PostDetailedResponse;
  /**
   * Author kebab menu (edit / publish / delete). A client island, gated on the
   * viewer being the author; injected by the route so this server component
   * stays free of session/`"use client"`.
   */
  headerMenu?: ReactNode;
  /**
   * Vote band. A client island (needs auth to decide `canVote` and to mutate);
   * injected by the route.
   */
  vote?: ReactNode;
  /**
   * Comments block, injected by the route (the composition root). Keeping the
   * comment feature out of this post-feature file avoids a sideways FSD import.
   */
  comments?: ReactNode;
  /**
   * Live comment-count metric for the byline. A client island (the route owns
   * the comment query); slotted so the byline itself stays server-rendered.
   */
  commentsCount?: ReactNode;
}

const nameOf = (u: AuthorPostResponse) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
  u.userName ||
  "Unknown";

const readTimeOf = (body: string) => {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const fmtMetric = (n: number) => n.toLocaleString("ru-RU");

/** Author tile + name/handle/date + view·like·comment metrics band. */
function PostByline({
  post,
  commentsCount,
}: {
  post: PostDetailedResponse;
  commentsCount: ReactNode;
}) {
  const authorHandle = post.author.userName ?? "";
  const readTime = readTimeOf(post.body);

  return (
    <section className="mx-[calc(50%-50vw)] mt-10 w-screen bg-[var(--m-card)]">
      <div className="mx-auto flex max-w-[780px] flex-wrap items-end gap-x-4 gap-y-4 px-10 py-10">
        <Link
          href={`/${authorHandle}`}
          aria-label={`${nameOf(post.author)} profile`}
          className="self-center"
        >
          <Avatar src={post.author.avatarUrl} name={nameOf(post.author)} />
        </Link>
        <div className="min-w-0">
          <span className="font-display block truncate text-[14px] font-semibold">
            {nameOf(post.author)}
          </span>
          <span className="text-[12px] text-[var(--m-muted)]">
            <Link
              href={`/${authorHandle}`}
              className="transition-colors hover:text-[var(--m-accent)]"
            >
              @{authorHandle}
            </Link>
            {` · ${formatDate2(post.createdAtUtc)} · ${readTime} min read`}
          </span>
        </div>

        {/* Right side: metrics */}
        <div className="ml-auto flex items-center gap-4 text-[12px] text-[var(--m-muted)] tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <EyeIcon className="size-3.5 shrink-0" />
            {fmtMetric(post.views ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HeartIcon className="size-3.5 shrink-0" />
            {fmtMetric(post.rating ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ChatBubbleLeftIcon className="size-3.5 shrink-0" />
            {commentsCount}
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * Server-rendered article: chip, `<h1>`, summary, byline, cover, and the prose
 * body all reach the HTML so crawlers (and the no-JS path) get real content.
 * Interactive pieces — the author kebab, the vote band, the comments composer —
 * are passed in as client islands and slotted into this server tree.
 */
export const PostView = ({
  post,
  headerMenu,
  vote,
  comments,
  commentsCount,
}: IProps) => {
  const cat = post.tags?.[0]?.tag ?? "post";

  // Status badge slot — pinned top-right of the header, same accent-chip
  // treatment as the home hero. No backing field yet; set this when a
  // pinned / latest-drop flag lands on the post model.
  const status: Status | null = null;

  return (
    <>
      {/* Above — on normal --m-bg: chip, title, summary */}
      <div className="mx-auto max-w-[780px] px-10">
        {/* Tag + draft + owner kebab */}
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <Category>{cat}</Category>
          {status && <StatusBadge status={status} className="ml-auto" />}
          {headerMenu}
        </div>

        {/* Title */}
        <h1 className="font-display text-[clamp(2rem,5vw,2.75rem)] leading-[1.04] font-bold tracking-[-0.02em] text-balance">
          {post.title}
        </h1>

        {post.summary && (
          <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
            {post.summary}
          </p>
        )}
      </div>

      {/* Byline band — full-bleed --m-card strip; no inner borders */}
      <PostByline post={post} commentsCount={commentsCount} />

      <article className="mx-auto max-w-[780px] px-10 pt-10">
        {/* Cover */}
        {post.coverUrl && (
          <div className="relative aspect-[16/9] w-full overflow-hidden border-2 border-[var(--m-dim)] bg-[var(--m-panel)]">
            <Image
              src={post.coverUrl}
              alt={post.title}
              fill
              sizes="(max-width: 860px) 100vw, 780px"
              priority
              unoptimized
              className="object-cover [filter:contrast(1.03)]"
            />
            {/* Draft overlay — a crossed-out eye makes the hidden state obvious
                (the cover is dimmed; only the author sees this page anyway). */}
            {!post.isPublished && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-[var(--m-bg)]/75">
                <EyeSlashIcon className="size-10 text-[var(--m-fg)]" />
                <span className="text-[11px] font-semibold tracking-[0.12em] text-[var(--m-fg)] uppercase">
                  Unpublished
                </span>
              </div>
            )}
          </div>
        )}

        {/* Prose — server-rendered markdown, shared with the editor preview.
            The mt-10 only separates the prose from the COVER; with no cover the
            article's own pt-10 is the single top gap (else they double up). */}
        <div className={post.coverUrl ? "mt-10" : ""}>
          <PostBody markdown={post.body} />
        </div>
      </article>

      {/* Rating band — full-bleed, shown to all readers; the vote click is gated
          inside the island. Outside the article text flow so the w-screen
          break-out can't trigger horizontal scroll. */}
      {vote}

      {/* Comments — injected by the route to keep the comment feature out of
          this post-feature file (FSD: no sideways feature imports). */}
      <div className="mx-auto max-w-[780px] px-10 pb-10">{comments}</div>
    </>
  );
};
