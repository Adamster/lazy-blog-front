"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Image } from "@heroui/react";
import {
  DisplayPostResponse,
  UserResponse,
  VotePostDirectionEnum,
} from "@/shared/api/openapi";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { useAllPosts } from "@/features/post/model/use-all-posts";
import { useViewMode } from "@/shared/providers/view-mode-provider";
import { MonoHeader } from "@/widgets/mono-header";
import { Sparkline, buildMonthlySeries } from "@/shared/ui/sparkline";
import {
  MonoLabel,
  MonoCategory,
  MonoMetric,
  MonoStatusBadge,
  MonoDot,
} from "@/shared/ui/mono";
import { formatDate2 } from "@/shared/lib/utils";

const nameOf = (u: UserResponse) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;
const catOf = (p: DisplayPostResponse) => p.tags?.[0]?.tag ?? "post";
const hrefOf = (p: DisplayPostResponse) => `/${p.author.userName}/${p.slug}`;
// First letter/digit of a title (skips punctuation like "(" so a placeholder
// shows a real character).
const firstLetter = (s?: string) =>
  (s?.match(/[\p{L}\p{N}]/u)?.[0] ?? "•").toUpperCase();

function Cover({ post }: { post: DisplayPostResponse }) {
  if (post.coverUrl) {
    return (
      <Image
        removeWrapper
        radius="none"
        src={post.coverUrl}
        alt={post.title}
        className="h-full w-full object-cover [filter:contrast(1.03)]"
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

export default function HomePageMono() {
  const query = useAllPosts();
  const observerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { view } = useViewMode();

  useEffect(() => {
    if (!observerRef.current || !query.hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && query.fetchNextPage(),
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [query, query.fetchNextPage, query.hasNextPage]);

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  const posts = (query.data?.pages?.flat() ?? []) as DisplayPostResponse[];
  const hero = posts[0];
  const rest = posts.slice(1);
  // While more pages can still load, only render complete 3-column rows so the
  // grid never shows a ragged trailing row before the next page arrives.
  const visibleGrid = query.hasNextPage
    ? rest.slice(0, Math.floor(rest.length / 3) * 3)
    : rest;
  // The list view is single-column, so a trailing partial row can't exist;
  // show every loaded post.
  const visibleList = rest;

  // Monthly stats are derived from the loaded feed until a dedicated API exists.
  const topPost = posts.reduce(
    (best, p) => (p.views > best.views ? p : best),
    posts[0]
  );
  const activity = new Map<
    string,
    { author: UserResponse; count: number; likes: number }
  >();
  posts.forEach((p) => {
    const key = p.author.userName ?? p.author.id ?? "";
    const cur = activity.get(key) ?? { author: p.author, count: 0, likes: 0 };
    cur.count += 1;
    cur.likes += p.rating ?? 0;
    activity.set(key, cur);
  });
  const topUser = [...activity.values()].sort((a, b) => b.count - a.count)[0];

  // Posts-per-month series: 6 consecutive months (0 for empty), anchored at the
  // most recent post. Derived from the loaded feed until a dedicated API exists.
  const series = buildMonthlySeries(posts.map((p) => p.createdAtUtc));

  return (
    <div
      className="mono-scope mx-[calc(50%-50vw)] min-h-screen w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <MonoHeader />

      <main className="mx-auto max-w-[1240px] px-10 pt-20 pb-10">
        {posts.length === 0 ? (
          <div className="border-2 border-[var(--m-line)] py-24 text-center">
            <p className="font-display text-3xl font-bold">{"// EMPTY FEED"}</p>
            <p className="mt-4 text-sm text-[var(--m-muted)]">
              No posts in the Lazyverse yet.
            </p>
          </div>
        ) : (
          <>
            {/* Stats — full-bleed band, filled like a post card (matches profile) */}
            <section className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
              <div className="mx-auto grid max-w-[1240px] gap-10 px-10 py-10 lg:grid-cols-3">
                <div className="hidden lg:block">
                  <MonoLabel caret className="mono-label mb-4">
                    MOST ACTIVE USER · JUN
                  </MonoLabel>
                  {topUser && (
                    <div className="min-w-0">
                      <Link
                        href={`/${topUser.author.userName}`}
                        className="mono-title block h-[30px] truncate !leading-[30px] transition-colors hover:text-[var(--m-accent)]"
                      >
                        {nameOf(topUser.author)}
                      </Link>
                      <div className="mt-4 flex items-center gap-2.5 text-[12px] text-[var(--m-muted)]">
                        <span>@{topUser.author.userName}</span>
                        <MonoDot />
                        <MonoMetric kind="posts" value={topUser.count} />
                        <MonoMetric kind="likes" value={topUser.likes} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden min-w-0 lg:block">
                  <MonoLabel className="mono-label mb-4">
                    TOP POST · JUN
                  </MonoLabel>
                  {topPost && (
                    <Link
                      href={hrefOf(topPost)}
                      className="group block min-w-0"
                    >
                      <div className="mono-title h-[30px] truncate !leading-[30px] transition-colors group-hover:text-[var(--m-accent)]">
                        {topPost.title}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[var(--m-muted)]">
                        <span>@{topPost.author.userName}</span>
                        <MonoDot />
                        <MonoMetric kind="views" value={topPost.views} />
                        <MonoMetric kind="likes" value={topPost.rating} />
                      </div>
                    </Link>
                  )}
                </div>

                <div>
                  <MonoLabel className="mono-label mb-2">
                    POSTS BY MONTH
                  </MonoLabel>
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

            {/* Section label — above the hero (view mode lives in the header menu) */}
            {rest.length > 0 && (
              <div className="flex items-center py-10">
                <MonoLabel>PUBLICATIONS</MonoLabel>
              </div>
            )}

            {/* Hero — bg-fill block, no border (Home 2) */}
            {hero && (
              <section className="group relative grid bg-[var(--m-card)] transition-colors hover:bg-[var(--m-panel)] lg:grid-cols-[1.05fr_1fr]">
                {/* Status badge — pinned top-right (LATEST DROP / future PINNED) */}
                <MonoStatusBadge
                  status="LATEST DROP"
                  className="absolute top-5 right-5 z-10"
                />
                <Link
                  href={hrefOf(hero)}
                  className="relative z-10 block aspect-[16/10] overflow-hidden bg-[var(--m-panel)]"
                >
                  <Cover post={hero} />
                </Link>
                <div className="flex flex-col justify-center p-8 lg:p-[34px]">
                  <div className="mb-2">
                    <MonoCategory>{catOf(hero)}</MonoCategory>
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
                      className="relative z-10 text-[var(--m-fg)] transition-colors hover:text-[var(--m-accent)]"
                    >
                      @{hero.author.userName}
                    </Link>
                    <MonoDot />
                    <span>{formatDate2(hero.createdAtUtc)}</span>
                    <MonoDot />
                    <MonoMetric
                      kind="likes"
                      value={hero.rating}
                      accent={hero.voteDirection === VotePostDirectionEnum.Up}
                    />
                    <MonoMetric kind="views" value={hero.views} />
                    <MonoMetric kind="comments" value={hero.comments} />
                  </div>
                </div>
              </section>
            )}

            {/* Grid view — bg-fill cards (no borders) */}
            {view === "grid" && visibleGrid.length > 0 && (
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
                    <div className="group relative flex h-full flex-col bg-[var(--m-card)] transition-colors hover:bg-[var(--m-panel)]">
                      <Link
                        href={hrefOf(p)}
                        aria-label={p.title}
                        className="relative z-10 block aspect-[16/10] overflow-hidden bg-[var(--m-panel)]"
                      >
                        <Cover post={p} />
                      </Link>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-2">
                          <MonoCategory>{catOf(p)}</MonoCategory>
                        </div>
                        <h3 className="mono-title text-balance transition-colors group-hover:text-[var(--m-accent)]">
                          <Link
                            href={hrefOf(p)}
                            className="after:absolute after:inset-0"
                          >
                            {p.title}
                          </Link>
                        </h3>
                        <div className="mt-auto flex items-center gap-4 pt-6 text-[12px] text-[var(--m-muted2)]">
                          <Link
                            href={`/${p.author.userName}`}
                            className="relative z-10 truncate text-[var(--m-fg)] transition-colors hover:text-[var(--m-accent)]"
                          >
                            @{p.author.userName}
                          </Link>
                          <span className="ml-auto flex items-center gap-4">
                            <MonoMetric
                              kind="likes"
                              value={p.rating}
                              accent={
                                p.voteDirection === VotePostDirectionEnum.Up
                              }
                            />
                            <MonoMetric kind="views" value={p.views} />
                            <MonoMetric kind="comments" value={p.comments} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </section>
            )}

            {/* List view — bg-fill rows (no borders) */}
            {view === "list" && visibleList.length > 0 && (
              <section className="mt-7 flex flex-col gap-7">
                {visibleList.map((p) => (
                  <div
                    key={p.id}
                    className="group relative grid bg-[var(--m-card)] transition-colors hover:bg-[var(--m-panel)] sm:grid-cols-[272px_1fr]"
                  >
                    <Link
                      href={hrefOf(p)}
                      aria-label={p.title}
                      className="relative z-10 block aspect-[16/10] overflow-hidden bg-[var(--m-panel)]"
                    >
                      <Cover post={p} />
                    </Link>
                    <div className="flex flex-col justify-center px-7 py-6">
                      <div className="mb-2">
                        <MonoCategory>{catOf(p)}</MonoCategory>
                      </div>
                      <h3 className="mono-title text-balance transition-colors group-hover:text-[var(--m-accent)]">
                        <Link
                          href={hrefOf(p)}
                          className="after:absolute after:inset-0"
                        >
                          {p.title}
                        </Link>
                      </h3>
                      <div className="mt-6 flex items-center gap-2.5 text-[12px] text-[var(--m-muted2)]">
                        <Link
                          href={`/${p.author.userName}`}
                          className="relative z-10 text-[var(--m-fg)] transition-colors hover:text-[var(--m-accent)]"
                        >
                          @{p.author.userName}
                        </Link>
                        <MonoDot />
                        <span>{formatDate2(p.createdAtUtc)}</span>
                        <span className="ml-auto flex items-center gap-4">
                          <MonoMetric
                            kind="likes"
                            value={p.rating}
                            accent={
                              p.voteDirection === VotePostDirectionEnum.Up
                            }
                          />
                          <MonoMetric kind="views" value={p.views} />
                          <MonoMetric kind="comments" value={p.comments} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {query.isFetchingNextPage && <Loading inline />}
            {query.hasNextPage && <div ref={observerRef} className="h-20" />}
          </>
        )}
      </main>
    </div>
  );
}
