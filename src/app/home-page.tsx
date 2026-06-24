"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { DisplayPostResponse, UserResponse } from "@/shared/api/openapi";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { useAllPosts } from "@/features/post/model/use-all-posts";
import { useHomeStats } from "@/features/post/model/use-home-stats";
import { Sparkline, seriesFromMonths } from "@/shared/ui/sparkline";
import {
  Label,
  Category,
  Metric,
  StatusBadge,
  Dot,
  MatrixText,
} from "@/shared/ui";
import { useInfiniteScroll } from "@/shared/lib/use-infinite-scroll";
import { formatDate2 } from "@/shared/lib/utils";
import { PostCard } from "@/features/post/ui/post-card";

const nameOf = (u: UserResponse) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;
const catOf = (p: DisplayPostResponse) => p.tags?.[0]?.tag ?? "post";
const hrefOf = (p: DisplayPostResponse) => `/${p.author.userName}/${p.slug}`;
// First letter/digit of a title (skips punctuation like "(" so a placeholder
// shows a real character).
const firstLetter = (s?: string) =>
  (s?.match(/[\p{L}\p{N}]/u)?.[0] ?? "•").toUpperCase();
// Current month, short + uppercase (JAN…DEC) — drives the live `// … · <MONTH>`
// eyebrow so the highlight period never goes stale.
const currentMonthLabel = () =>
  new Date().toLocaleDateString("en-US", { month: "short" }).toUpperCase();

function HeroCover({ post }: { post: DisplayPostResponse }) {
  if (post.coverUrl) {
    return (
      <Image
        src={post.coverUrl}
        alt={post.title}
        fill
        sizes="(max-width: 1024px) 100vw, 640px"
        priority
        unoptimized
        className="object-cover [filter:contrast(1.03)]"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--m-panel)]">
      <span className="font-display text-5xl font-bold text-[var(--m-accent)] select-none">
        {firstLetter(post.title)}
      </span>
    </div>
  );
}

export default function HomePage() {
  const query = useAllPosts();
  const stats = useHomeStats();
  const reduceMotion = useReducedMotion();

  const sentinelRef = useInfiniteScroll({
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetching: query.isFetchingNextPage,
  });

  // Only a true COLD start (no cached pages yet) — on a warm return the infinite
  // query is non-pending, so the cached feed renders instantly with no fallback.
  // One plain loader (no skeleton) so cold-load + navigation share a single
  // spinner with no loader→skeleton→content flicker.
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  // Defensive: the public home feed only ever shows published posts (drafts are
  // author-only). Guards against a stale cache / API edge surfacing a draft.
  const posts = (
    (query.data?.pages?.flat() ?? []) as DisplayPostResponse[]
  ).filter((p) => p.isPublished);
  const hero = posts[0];
  const rest = posts.slice(1);
  // While more pages can still load, only render complete 3-column rows so the
  // grid never shows a ragged trailing row before the next page arrives.
  const visibleGrid = query.hasNextPage
    ? rest.slice(0, Math.floor(rest.length / 3) * 3)
    : rest;

  // Stats band data comes from the dedicated aggregate endpoint, NOT the feed.
  // Highlights are null when the current UTC month has no data (backend reports
  // the month truthfully — the FRONTEND owns the empty state, Option A).
  const topUser = stats.data?.mostActiveUser;
  const topPost = stats.data?.topPost;
  const series = seriesFromMonths(stats.data?.postsByMonth ?? []);
  const month = currentMonthLabel();

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-10 pb-10">
        {posts.length === 0 ? (
          <div className="border-2 border-[var(--m-line)] py-24 text-center">
            <p className="font-display text-[32px] leading-none font-bold tracking-[-0.02em]">
              {"// EMPTY FEED"}
            </p>
            <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
              No posts in the Lazyverse yet.
            </p>
          </div>
        ) : (
          <>
            {/* Stats — full-bleed band, filled like a post card (matches profile) */}
            <section className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
              <div className="mx-auto grid max-w-[1240px] gap-10 px-10 py-10 lg:grid-cols-3">
                <div className="hidden lg:block">
                  <Label className="mono-label mb-4">
                    {`MOST ACTIVE USER · ${month}`}
                  </Label>
                  {!stats.isLoading &&
                    (topUser ? (
                      <div className="min-w-0">
                        <Link
                          href={`/${topUser.user.userName}`}
                          className="group block"
                        >
                          <div className="mono-title block h-[30px] truncate !leading-[30px] transition-colors group-hover:text-[var(--m-accent)]">
                            {nameOf(topUser.user)}
                          </div>
                        </Link>
                        <div className="mt-4 flex items-center gap-2.5 text-[12px] text-[var(--m-muted)]">
                          <Link
                            href={`/${topUser.user.userName}`}
                            className="transition-colors hover:text-[var(--m-accent)]"
                          >
                            @{topUser.user.userName}
                          </Link>
                          <Dot />
                          <span className="flex items-center gap-4">
                            <Metric kind="posts" value={topUser.postCount} />
                            <Metric kind="rating" value={topUser.netRating} />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Label className="mono-label flex h-[30px] items-center text-[var(--m-muted2)]">
                        <MatrixText text="NO LEADER YET" />
                      </Label>
                    ))}
                </div>

                <div className="hidden min-w-0 lg:block">
                  <Label className="mono-label mb-4">
                    {`TOP POST · ${month}`}
                  </Label>
                  {!stats.isLoading &&
                    (topPost ? (
                      <div className="min-w-0">
                        <Link
                          href={`/${topPost.userName}/${topPost.slug}`}
                          className="group block"
                        >
                          <div className="mono-title h-[30px] truncate !leading-[30px] transition-colors group-hover:text-[var(--m-accent)]">
                            {topPost.title}
                          </div>
                        </Link>
                        <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[var(--m-muted)]">
                          <Link
                            href={`/${topPost.userName}`}
                            className="transition-colors hover:text-[var(--m-accent)]"
                          >
                            @{topPost.userName}
                          </Link>
                          <Dot />
                          <span className="flex items-center gap-4">
                            <Metric kind="views" value={topPost.views} />
                            <Metric kind="rating" value={topPost.netRating} />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Label className="mono-label flex h-[30px] items-center text-[var(--m-muted2)]">
                        <MatrixText text="WARMING UP ..." />
                      </Label>
                    ))}
                </div>

                <div>
                  <Label className="mono-label mb-2">POSTS BY MONTH</Label>
                  <Sparkline
                    series={series}
                    gradientId="homeSparkGrad"
                    labelClassName="text-[var(--m-muted)]"
                    ariaLabel={`Posts by month: ${series
                      .map((s) => `${s.label} ${s.count}`)
                      .join(", ")}`}
                  />
                </div>
              </div>
            </section>

            {/* Section label — above the hero */}
            {rest.length > 0 && (
              <div className="flex items-center pt-10 pb-6">
                <Label>PUBLICATIONS</Label>
              </div>
            )}

            {/* Hero — bg-fill block, no border (Home 2) */}
            {hero && (
              <section className="group relative grid bg-[var(--m-card)] transition-colors hover:bg-[var(--m-panel)] lg:grid-cols-[1.05fr_1fr]">
                {/* Status badge — pinned top-right (LATEST DROP / future PINNED) */}
                <StatusBadge
                  status="LATEST DROP"
                  className="absolute top-5 right-5 z-10"
                />
                <Link
                  href={hrefOf(hero)}
                  className="relative z-10 block aspect-[16/10] overflow-hidden bg-[var(--m-panel)]"
                >
                  <HeroCover post={hero} />
                </Link>
                <div className="flex flex-col justify-center p-8 lg:p-[34px]">
                  <div className="mb-2">
                    <Category>{catOf(hero)}</Category>
                  </div>
                  <h1 className="font-display text-[clamp(2rem,4vw,2.5rem)] leading-[1.04] font-bold tracking-[-0.02em] text-balance transition-colors group-hover:text-[var(--m-accent)]">
                    <Link
                      href={hrefOf(hero)}
                      className="after:absolute after:inset-0"
                    >
                      {hero.title}
                    </Link>
                  </h1>
                  {hero.summary && (
                    <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
                      {hero.summary}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-2.5 text-[12px] text-[var(--m-muted)]">
                    <Link
                      href={`/${hero.author.userName}`}
                      className="relative z-10 text-[var(--m-muted)] transition-colors hover:text-[var(--m-accent)]"
                    >
                      @{hero.author.userName}
                    </Link>
                    <Dot />
                    <span>{formatDate2(hero.createdAtUtc)}</span>
                    <Dot />
                    <span className="flex items-center gap-4">
                      <Metric kind="views" value={hero.views} />
                      <Metric kind="comments" value={hero.comments} />
                      <Metric kind="rating" value={hero.rating} />
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Grid feed — shared PostCard (bg-fill cards, no borders) */}
            {visibleGrid.length > 0 && (
              <section className="mt-7 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {visibleGrid.map((p, index) => (
                  <motion.div
                    key={p.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    whileInView={
                      reduceMotion ? undefined : { opacity: 1, y: 0 }
                    }
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.16,
                      delay: Math.min(index * 0.04, 0.32),
                    }}
                  >
                    <PostCard
                      post={p}
                      href={hrefOf(p)}
                      authorHandle={p.author.userName ?? undefined}
                    />
                  </motion.div>
                ))}
              </section>
            )}

            {query.isFetchingNextPage && <Loading inline section />}
            {query.hasNextPage && <div ref={sentinelRef} className="h-20" />}
          </>
        )}
      </main>
    </div>
  );
}
