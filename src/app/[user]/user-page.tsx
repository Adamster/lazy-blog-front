"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EyeIcon, StarIcon } from "@heroicons/react/24/solid";
import { useUser } from "@/entities/session";
import { usePostsByUserName } from "@/features/post/model/use-posts-by-username";
import {
  PublicationsFilter,
  type PublicationsView,
} from "@/features/post/ui/publications-filter";
import {
  Label,
  Avatar,
  Dot,
  fmt,
  Loading,
  ErrorMessage,
  Sparkline,
  seriesFromMonths,
} from "@/shared/ui";
import { MatrixText } from "@/shared/ui/effects";
import { useInfiniteScroll } from "@/shared/lib/use-infinite-scroll";
import { displayNameOf, formatDate2 } from "@/shared/lib/utils";
import { PostCard } from "@/features/post/ui/post-card";

export default function UserPage({ userName }: { userName: string }) {
  const query = usePostsByUserName(userName);
  const reduceMotion = useReducedMotion();

  // The backend mixes the owner's drafts into `postItems` only when viewer === owner,
  // so the toggle is a client-side split of one stream, never a second fetch.
  const { user: viewer, isUserResolved } = useUser();
  const [view, setView] = useState<PublicationsView>("all");

  const sentinelRef = useInfiniteScroll({
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetching: query.isFetchingNextPage,
  });

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  const allPosts = query.data?.pages.flatMap((page) => page.postItems) ?? [];
  const profile = query.data?.pages[0];
  const totalPosts = profile?.totalPostCount ?? 0;
  const user = profile?.user;
  const handle = user?.userName ?? userName;

  const isOwner = isUserResolved && !!viewer?.id && viewer.id === user?.id;
  const showDrafts = isOwner && view === "drafts";
  const posts =
    isOwner && view !== "all"
      ? allPosts.filter((p) => (showDrafts ? !p.isPublished : p.isPublished))
      : allPosts;

  // Drafts are interleaved across the paginated stream, so keep paging until it's
  // exhausted before calling a filtered view "empty".
  const isExhausting = isOwner && posts.length === 0 && query.hasNextPage;
  const emptyState = posts.length === 0 && !isExhausting;

  // Whole-account aggregates off the profile response, NOT summed from the loaded page.
  const totalKarma =
    (profile?.totalUpVotes ?? 0) - (profile?.totalDownVotes ?? 0);
  const totalViews = profile?.totalViews ?? 0;

  const series = seriesFromMonths(profile?.activity ?? []);

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-10 pb-10">
        <section className="flex flex-col gap-10 pb-10 sm:flex-row sm:items-center">
          <Avatar
            src={user?.avatarUrl}
            name={displayNameOf(user, "—")}
            size="lg"
          />

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[40px] leading-none font-bold tracking-[-0.02em]">
              {displayNameOf(user, "—")}
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

        <section className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-10 py-10 sm:grid-cols-3">
            <div>
              <Label>KARMA</Label>
              <div
                className="font-display mt-4 text-[46px] leading-none font-bold tracking-[-0.02em] tabular-nums"
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
              <div className="mt-2 flex items-center gap-2.5 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
                <StarIcon aria-hidden className="size-3.5" />
                net rating
              </div>
            </div>

            <div>
              <Label>TOTAL VIEWS</Label>
              <div className="font-display mt-4 text-[46px] leading-none font-bold tracking-[-0.02em] text-[var(--m-accent)] tabular-nums">
                {fmt(totalViews)}
              </div>
              <div className="mt-2 flex items-center gap-2.5 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
                <EyeIcon className="size-3.5" />
                views total
              </div>
            </div>

            <div>
              <Label>ACTIVITY · 6M</Label>
              {/* Always draw the chart — an empty profile reads as a flat line of zeros, not "no data". */}
              <div className="mt-4">
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

        {/* Owner keeps the filter reachable even when the view is empty; a visitor
            (or a postless owner) gets the scramble in place of the label. */}
        {isOwner && allPosts.length > 0 ? (
          <div className="flex items-center justify-between pt-10 pb-6">
            <Label className="mono-label">PUBLICATIONS</Label>
            <PublicationsFilter view={view} onChange={setView} />
          </div>
        ) : (
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
        )}

        {isOwner && allPosts.length > 0 && emptyState && (
          <p className="pb-10 text-[14px] leading-[1.6] text-[var(--m-muted)]">
            {showDrafts
              ? "No drafts — every idea already shipped."
              : "Nothing published yet — all your work is still in drafts."}
          </p>
        )}

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

        {(query.isFetchingNextPage || isExhausting) && (
          <Loading inline section />
        )}
        {query.hasNextPage && <div ref={sentinelRef} className="h-20" />}
      </main>
    </div>
  );
}
