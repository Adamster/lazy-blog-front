"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/solid";
import { AuthorPostResponse, PostDetailedResponse } from "@/shared/api/openapi";
import { formatDate2 } from "@/shared/lib/utils";
import { useAuth } from "@/features/auth/model/use-auth";
import { useUser } from "@/features/user/provider/user-provider";
import { IsAuthor } from "@/features/auth/guards/is-author";
import { Avatar, Category, StatusBadge } from "@/shared/ui";
import type { Status } from "@/shared/ui";
import { PostVote } from "./post-vote";
import { PostHeaderMenu } from "./post-header-menu";
import { Crepe } from "./crepe-wrapper";

interface IProps {
  post: PostDetailedResponse | undefined;
  /**
   * Comments block, injected by the route (the composition root). Keeping the
   * comment feature out of this post-feature file avoids a sideways FSD import.
   */
  comments?: ReactNode;
  /** Comment count for the byline metric (the route owns the comment query). */
  commentsCount?: number;
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
  commentsCount: number;
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
          <Link
            href={`/${authorHandle}`}
            className="font-display block truncate text-[14px] font-semibold hover:text-[var(--m-accent)]"
          >
            {nameOf(post.author)}
          </Link>
          <span className="text-[12px] text-[var(--m-muted)]">
            @{authorHandle} · {formatDate2(post.createdAtUtc)} · {readTime} min
            read
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

export const PostView = ({ post, comments, commentsCount = 0 }: IProps) => {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();

  if (!post) return null;

  const cat = post.tags?.[0]?.tag ?? "post";
  const authorHandle = post.author.userName ?? "";

  // Voting is allowed for authenticated readers who are NOT the author. The
  // section is shown to everyone (logged-out / owner included); the click is
  // gated inside PostVote via `canVote`.
  const isAuthor = !!user?.id && user.id === post.author.id;
  const canVote = isAuthenticated && !isAuthor;

  // Status badge slot — pinned top-right of the header, same accent-chip
  // treatment as the home hero. No backing field yet; set this when a
  // pinned / latest-drop flag lands on the post model.
  const status: Status | null = null;

  return (
    <>
      {/* Above — on normal --m-bg: chip, title, summary */}
      <div className="mx-auto max-w-[780px] px-10 pt-10">
        {/* Tag + draft + owner kebab */}
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <Category>{cat}</Category>
          {!post.isPublished && (
            <span className="border-2 border-[var(--m-accent)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] text-[var(--m-accent)] uppercase">
              [ Draft ]
            </span>
          )}
          {status && <StatusBadge status={status} className="ml-auto" />}
          <IsAuthor userId={post.author.id || ""}>
            <div className={status ? "" : "ml-auto"}>
              <PostHeaderMenu
                postId={post.id}
                postSlug={post.slug}
                authorHandle={authorHandle}
                isPublished={post.isPublished}
              />
            </div>
          </IsAuthor>
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
          </div>
        )}

        {/* Prose — existing body, unchanged */}
        <div className="mono-prose mt-10">
          <Crepe readonly markdown={post.body} />
        </div>
      </article>

      {/* Rating section — full-bleed band, shown to ALL readers; the vote click
          is gated via `canVote` (auth'd & non-author). Outside the article text
          flow so the w-screen break-out can't trigger horizontal scroll. */}
      <PostVote
        voteDirection={post.voteDirection}
        postId={post.id}
        postSlug={post.slug}
        rating={post.rating}
        canVote={canVote}
      />

      {/* Comments — injected by the route to keep the comment feature out of
          this post-feature file (FSD: no sideways feature imports). */}
      <div className="mx-auto max-w-[780px] px-10 pb-10">{comments}</div>
    </>
  );
};
