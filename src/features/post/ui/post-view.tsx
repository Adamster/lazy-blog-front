import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/solid";
import { PostDetailedResponse } from "@/shared/api/openapi";
import { displayNameOf, formatDate2 } from "@/shared/lib/utils";
import { Avatar, Category, Dot, Metric, StatusBadge } from "@/shared/ui";
import { PostBody } from "@/shared/ui/prose";
import { DraftOverlay } from "@/features/post/ui/draft-overlay";
import type { Status } from "@/shared/ui";
import { UNTAGGED_LABEL } from "../lib/untagged-label";

interface IProps {
  post: PostDetailedResponse;
  // The interactive props below are client islands injected by the route, so this
  // server component stays session-free and avoids sideways FSD feature imports.
  headerMenu?: ReactNode;
  vote?: ReactNode;
  comments?: ReactNode;
  commentsCount?: ReactNode;
}

function PostByline({
  post,
  commentsCount,
}: {
  post: PostDetailedResponse;
  commentsCount: ReactNode;
}) {
  const authorHandle = post.author.userName ?? "";

  return (
    <section className="mx-[calc(50%-50vw)] mt-10 w-screen bg-[var(--m-card)]">
      <div className="mx-auto flex max-w-[780px] flex-wrap items-end gap-x-4 gap-y-4 px-10 py-10">
        <Link
          href={`/${authorHandle}`}
          aria-label={`${displayNameOf(post.author)} profile`}
          className="self-center"
        >
          <Avatar
            src={post.author.avatarUrl}
            name={displayNameOf(post.author)}
          />
        </Link>
        <div className="min-w-0">
          <span className="font-display block truncate text-[14px] font-semibold">
            {displayNameOf(post.author)}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2.5 text-[12px] text-[var(--m-muted)]">
            <Link
              href={`/${authorHandle}`}
              className="transition-colors hover:text-[var(--m-accent)]"
            >
              @{authorHandle}
            </Link>
            <Dot />
            <span className="tabular-nums">
              {formatDate2(post.createdAtUtc)}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-[12px] text-[var(--m-muted)] sm:ml-auto">
          <Metric kind="views" value={post.views ?? 0} />
          {/* Hand-rolled to match the Metric primitive (the count is a live island). */}
          <span
            className="inline-flex items-center gap-1 tabular-nums"
            aria-label="Comments"
          >
            <ChatBubbleLeftIcon className="size-3.5 shrink-0" />
            {commentsCount}
          </span>
          <Metric kind="rating" value={post.rating ?? 0} />
        </div>
      </div>
    </section>
  );
}

// Server-rendered so crawlers + the no-JS path get real content; interactive
// pieces are slotted in as client islands.
export const PostView = ({
  post,
  headerMenu,
  vote,
  comments,
  commentsCount,
}: IProps) => {
  const cat = post.tags?.[0]?.tag ?? UNTAGGED_LABEL;

  // No backing field yet — set when a pinned / latest-drop flag lands on the model.
  const status: Status | null = null;

  return (
    <>
      <div className="mx-auto max-w-[780px] px-10 pt-10">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <Category>{cat}</Category>
          {status && <StatusBadge status={status} className="ml-auto" />}
          {headerMenu}
        </div>

        <h1 className="font-display text-[32px] leading-[1.04] font-bold tracking-[-0.02em] text-balance md:text-[40px]">
          {post.title}
        </h1>

        {post.summary && (
          <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
            {post.summary}
          </p>
        )}
      </div>

      <PostByline post={post} commentsCount={commentsCount} />

      <article className="mx-auto max-w-[780px] px-10 pt-10">
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
            {!post.isPublished && <DraftOverlay size="page" />}
          </div>
        )}

        {/* mt-10 only separates prose from the COVER; with no cover the article's
            own pt-10 is the single top gap (else they double up). */}
        <div className={post.coverUrl ? "mt-10" : ""}>
          <PostBody markdown={post.body} />
        </div>
      </article>

      {/* Outside the article text flow so the w-screen break-out can't trigger
          horizontal scroll. */}
      {vote}

      <div className="mx-auto max-w-[780px] px-10 pb-10">{comments}</div>
    </>
  );
};
