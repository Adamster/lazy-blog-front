"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EyeIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import { UserResponse } from "@/shared/api/openapi";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { usePostsByUserName } from "@/features/post/model/use-posts-by-username";
import { Sparkline, seriesFromMonths } from "@/shared/ui/sparkline";
import { Label, MatrixText, Avatar, Dot, fmt } from "@/shared/ui";
import { useInfiniteScroll } from "@/shared/lib/use-infinite-scroll";
import { formatDate2 } from "@/shared/lib/utils";
import { PostCard } from "@/features/post/ui/post-card";

const nameOf = (u?: UserResponse) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.userName || "—";

export default function UserPage({ userName }: { userName: string }) {
  const query = usePostsByUserName(userName);
  const reduceMotion = useReducedMotion();

  const sentinelRef = useInfiniteScroll({
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetching: query.isFetchingNextPage,
  });

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  const posts = query.data?.pages.flatMap((page) => page.postItems) ?? [];
  const profile = query.data?.pages[0];
  const totalPosts = profile?.totalPostCount ?? 0;
  const user = profile?.user;
  const handle = user?.userName ?? userName;

  // Karma (net rating) / views / activity are whole-account aggregates off the
  // profile response — NOT summed from the loaded page (which only sees what's
  // paginated in so far).
  const totalKarma =
    (profile?.totalUpVotes ?? 0) - (profile?.totalDownVotes ?? 0);
  const totalViews = profile?.totalViews ?? 0;

  // Activity: rolling "last 6 months" window (0 for empty months), mapped from
  // the per-month post counts the backend returns.
  const series = seriesFromMonths(profile?.activity ?? []);

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-10 pb-10">
        {/* Profile header */}
        <section className="flex flex-col gap-8 pt-10 pb-10 sm:flex-row sm:items-center">
          <Avatar src={user?.avatarUrl} name={nameOf(user)} size="lg" />

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[40px] leading-none font-bold tracking-[-0.02em]">
              {nameOf(user)}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[12px] text-[var(--m-muted)]">
              <span className="font-medium text-[var(--m-accent)]">
                @{handle}
              </span>
              {user?.createdOnUtc && (
                <>
                  <Dot />
                  <span>joined {formatDate2(user.createdOnUtc)}</span>
                </>
              )}
              <Dot />
              <span className="font-semibold text-[var(--m-fg)]">
                {fmt(totalPosts)} posts
              </span>
            </div>
            {user?.biography ? (
              <p className="mt-4 max-w-[40em] text-[14px] leading-[1.6] whitespace-pre-line text-[var(--m-muted)]">
                {user.biography}
              </p>
            ) : null}
          </div>
        </section>

        {/* Stat row — karma / views / activity sparkline */}
        <section className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-10 py-10 sm:grid-cols-3">
            <div>
              <Label>KARMA</Label>
              <div
                className="font-display mt-2 text-[46px] leading-none font-bold tracking-[-0.02em] tabular-nums"
                style={{
                  color:
                    totalKarma > 0
                      ? "var(--m-accent)"
                      : totalKarma < 0
                        ? "var(--m-error)"
                        : "var(--m-muted)",
                }}
              >
                {fmt(totalKarma)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
                {totalKarma >= 0 ? (
                  <ArrowUpIcon className="size-3.5" />
                ) : (
                  <ArrowDownIcon className="size-3.5" />
                )}
                net rating
              </div>
            </div>

            <div>
              <Label>TOTAL VIEWS</Label>
              <div className="font-display mt-2 text-[46px] leading-none font-bold tracking-[-0.02em] text-[var(--m-accent)] tabular-nums">
                {fmt(totalViews)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
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

        {/* Publications — when empty, the scramble takes over the label itself,
            so it's a terminal section (symmetric py-10); when populated the
            eyebrow hugs its content below (pt-10 pb-6). */}
        <Label
          className={`mono-label ${posts.length === 0 ? "py-10" : "pt-10 pb-6"}`}
        >
          {posts.length === 0 ? (
            <MatrixText
              text={`${handle} is still lost in procrastination`.toUpperCase()}
            />
          ) : (
            "PUBLICATIONS"
          )}
        </Label>

        {posts.length === 0 ? null : (
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
                <PostCard post={p} href={`/${handle}/${p.slug}`} />
              </motion.div>
            ))}
          </section>
        )}

        {query.isFetchingNextPage && <Loading inline section />}
        {query.hasNextPage && <div ref={sentinelRef} className="h-20" />}
      </main>
    </div>
  );
}
