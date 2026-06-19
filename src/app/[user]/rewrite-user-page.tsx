"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Image } from "@heroui/react";
import { HeartIcon, EyeIcon } from "@heroicons/react/24/solid";
import { UserPostItem, UserResponse } from "@/shared/api/openapi";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { usePostsByUserName } from "@/features/post/model/use-posts-by-username";
import { useViewMode } from "@/shared/providers/view-mode-provider";
import { Header } from "@/widgets/rewrite-header";
import { Sparkline, buildMonthlySeries } from "@/shared/ui/sparkline";
import { Label, Category, Metric, MatrixText, fmt } from "@/shared/ui";
import { formatDate2 } from "@/shared/lib/utils";

const nameOf = (u?: UserResponse) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.userName || "—";

const initOf = (u?: UserResponse) =>
  (u?.firstName?.[0] || u?.userName?.[0] || "•").toUpperCase();

const catOf = (p: UserPostItem) => p.tags?.[0]?.tag ?? "post";
const firstLetter = (s?: string) =>
  (s?.match(/[\p{L}\p{N}]/u)?.[0] ?? "•").toUpperCase();

function Cover({ post }: { post: UserPostItem }) {
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
    <div className="flex h-full w-full items-center justify-center bg-[var(--m-dim)]">
      <span className="font-display text-5xl font-bold text-[var(--m-accent)] select-none">
        {firstLetter(post.title)}
      </span>
    </div>
  );
}

export default function UserPageMono({ userName }: { userName: string }) {
  const query = usePostsByUserName(userName);
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

  const posts = query.data?.pages.flatMap((page) => page.postItems) ?? [];
  const totalPosts = query.data?.pages[0]?.totalPostCount ?? 0;
  const user = query.data?.pages[0]?.user;

  // Likes / views / activity are derived from the loaded posts until a
  // dedicated aggregate API exists; they grow as more pages load in.
  const totalLikes = posts.reduce((sum, p) => sum + (p.rating ?? 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.views ?? 0), 0);

  // Activity: a rolling "last 6 months" window anchored at the current month
  // (0 for empty months). Derived from loaded posts until a dedicated API exists.
  const series = buildMonthlySeries(
    posts.map((p) => p.createdAtUtc),
    6,
    true
  );

  return (
    <div
      className="mono-scope mx-[calc(50%-50vw)] min-h-screen w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <Header />

      <main className="mx-auto max-w-[1240px] px-10 pt-10 pb-10">
        {/* Profile header */}
        <section className="flex flex-col gap-8 pb-10 sm:flex-row sm:items-start">
          <div className="size-32 flex-none overflow-hidden">
            {user?.avatarUrl ? (
              <Image
                removeWrapper
                radius="none"
                src={user.avatarUrl}
                alt={nameOf(user)}
                className="size-32 object-cover [filter:contrast(1.03)]"
              />
            ) : (
              <div className="font-display flex size-32 items-center justify-center border-2 border-[var(--m-accent)] text-5xl font-bold text-[var(--m-accent)] select-none">
                {initOf(user)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[40px] leading-none font-bold tracking-[-0.02em]">
              {nameOf(user)}
            </h1>
            <div className="mt-4 text-[12px] text-[var(--m-muted)]">
              <span>@{user?.userName ?? userName}</span>
              {user?.createdOnUtc && (
                <span> · joined {formatDate2(user.createdOnUtc)}</span>
              )}
              <span>
                {" · "}
                <span className="font-semibold text-[var(--m-fg)]">
                  {fmt(totalPosts)} posts
                </span>
              </span>
            </div>
            {user?.biography ? (
              <p className="mt-4 max-w-[40em] text-[14px] leading-[1.6] whitespace-pre-line text-[var(--m-muted)]">
                {user.biography}
              </p>
            ) : (
              <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted2)]">
                404: bio not found
              </p>
            )}
          </div>
        </section>

        {/* Stat row — likes / views / activity sparkline */}
        <section className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-10 py-10 sm:grid-cols-3">
            <div>
              <Label>TOTAL LIKES</Label>
              <div className="font-display mt-2 text-[46px] leading-none font-bold tracking-[-0.02em] text-[var(--m-accent)] tabular-nums">
                {fmt(totalLikes)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
                <HeartIcon className="size-3.5" />
                likes received
              </div>
            </div>

            <div>
              <Label>TOTAL VIEWS</Label>
              <div className="font-display mt-2 text-[46px] leading-none font-bold tracking-[-0.02em] text-[var(--m-accent)] tabular-nums">
                {fmt(totalViews)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
                <EyeIcon className="size-3.5" />
                views total
              </div>
            </div>

            <div>
              <Label>ACTIVITY · 6M</Label>
              {/* Always draw the chart — an empty profile reads as a flat
                  line of zeros rather than a "no data" message. */}
              <div className="mt-2">
                <Sparkline
                  series={series}
                  gradientId="profileSparkGrad"
                  ariaLabel={`Activity by month: ${series
                    .map((s) => `${s.label} ${s.count}`)
                    .join(", ")}`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Publications — when empty, the scramble takes over the label itself */}
        <Label className="mono-label py-10">
          {posts.length === 0 ? (
            <MatrixText
              text={`${user?.userName ?? userName} is still lost in procrastination`.toUpperCase()}
            />
          ) : (
            "PUBLICATIONS"
          )}
        </Label>

        {posts.length === 0 ? null : view === "grid" ? (
          <section className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, index) => (
              <motion.div
                key={p.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.16,
                  delay: Math.min(index * 0.04, 0.32),
                }}
              >
                <Link
                  href={`/${user?.userName ?? userName}/${p.slug}`}
                  className="group flex h-full flex-col bg-[var(--m-card)] transition-colors hover:bg-[var(--m-panel)]"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <Cover post={p} />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2">
                      <Category>{catOf(p)}</Category>
                    </div>
                    <h3 className="mono-title text-balance transition-colors group-hover:text-[var(--m-accent)]">
                      {p.title}
                    </h3>
                    <div className="mt-auto flex items-center gap-4 pt-6 text-[12px] text-[var(--m-muted2)]">
                      <span>{formatDate2(p.createdAtUtc)}</span>
                      <span className="ml-auto flex items-center gap-4">
                        <Metric kind="likes" value={p.rating} />
                        <Metric kind="views" value={p.views} />
                        <Metric kind="comments" value={p.comments} />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </section>
        ) : (
          <section className="flex flex-col gap-7">
            {posts.map((p) => (
              <div
                key={p.id}
                className="group relative grid bg-[var(--m-card)] transition-colors hover:bg-[var(--m-panel)] sm:grid-cols-[272px_1fr]"
              >
                <div className="aspect-[16/10] overflow-hidden bg-[var(--m-panel)]">
                  <Cover post={p} />
                </div>
                <div className="flex flex-col justify-center px-7 py-6">
                  <div className="mb-2">
                    <Category>{catOf(p)}</Category>
                  </div>
                  <h3 className="mono-title text-balance transition-colors group-hover:text-[var(--m-accent)]">
                    <Link
                      href={`/${user?.userName ?? userName}/${p.slug}`}
                      className="after:absolute after:inset-0"
                    >
                      {p.title}
                    </Link>
                  </h3>
                  <div className="mt-6 flex items-center gap-2.5 text-[12px] text-[var(--m-muted2)]">
                    <span>{formatDate2(p.createdAtUtc)}</span>
                    <span className="ml-auto flex items-center gap-4">
                      <Metric kind="likes" value={p.rating} />
                      <Metric kind="views" value={p.views} />
                      <Metric kind="comments" value={p.comments} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {query.isFetchingNextPage && <Loading inline />}
        {query.hasNextPage && <div ref={observerRef} className="h-20" />}
      </main>
    </div>
  );
}
