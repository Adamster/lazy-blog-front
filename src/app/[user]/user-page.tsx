"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HeartIcon, EyeIcon } from "@heroicons/react/24/solid";
import { UserResponse } from "@/shared/api/openapi";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { usePostsByUserName } from "@/features/post/model/use-posts-by-username";
import { Sparkline, buildMonthlySeries } from "@/shared/ui/sparkline";
import { Label, MatrixText, Avatar, fmt } from "@/shared/ui";
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
  const totalPosts = query.data?.pages[0]?.totalPostCount ?? 0;
  const user = query.data?.pages[0]?.user;
  const handle = user?.userName ?? userName;

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
      <main className="mx-auto max-w-[1240px] px-10 pt-10 pb-10">
        {/* Profile header */}
        <section className="flex flex-col gap-8 pb-10 sm:flex-row sm:items-start">
          <Avatar src={user?.avatarUrl} name={nameOf(user)} size="lg" />

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[40px] leading-none font-bold tracking-[-0.02em]">
              {nameOf(user)}
            </h1>
            <div className="mt-4 text-[12px] text-[var(--m-muted)]">
              <span className="font-medium text-[var(--m-accent)]">
                @{handle}
              </span>
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
