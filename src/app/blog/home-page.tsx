"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { DisplayPostResponse } from "@/shared/api/openapi";
import { useAllPosts } from "@/features/post/model/use-all-posts";
import {
  Category,
  Metric,
  StatusBadge,
  Label,
  Loading,
  ErrorMessage,
} from "@/shared/ui";
import { useInfiniteScroll } from "@/shared/lib/use-infinite-scroll";
import { formatDateShort } from "@/shared/lib/utils";
import { postHref, userHref } from "@/shared/lib/routes";
import { PostCard } from "@/features/post/ui/post-card";

const catOf = (p: DisplayPostResponse) => p.tags?.[0]?.tag ?? "post";
const hrefOf = (p: DisplayPostResponse) =>
  postHref(p.author.userName ?? "", p.slug);
const firstLetter = (s?: string) =>
  (s?.match(/[\p{L}\p{N}]/u)?.[0] ?? "•").toUpperCase();

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
      <span className="font-display text-[46px] font-bold text-[var(--m-accent)] select-none">
        {firstLetter(post.title)}
      </span>
    </div>
  );
}

export default function HomePage() {
  const query = useAllPosts();
  const reduceMotion = useReducedMotion();

  const sentinelRef = useInfiniteScroll({
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetching: query.isFetchingNextPage,
  });

  // Cold start only; one plain loader (no skeleton) avoids a loader→skeleton→content flicker.
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  // Defensive: drafts are author-only — guard a stale cache / API edge surfacing one.
  const posts = (
    (query.data?.pages?.flat() ?? []) as DisplayPostResponse[]
  ).filter((p) => p.isPublished);
  const hero = posts[0];
  const rest = posts.slice(1);
  // While more pages can load, render only complete 3-col rows so the trailing row never reads ragged.
  const visibleGrid = query.hasNextPage
    ? rest.slice(0, Math.floor(rest.length / 3) * 3)
    : rest;

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-5 pb-10 sm:px-10">
        {posts.length === 0 ? (
          <div className="border-2 border-[var(--m-line)] py-24 text-center">
            <p className="font-display text-[32px] leading-none font-bold tracking-[-0.02em]">
              {"// EMPTY FEED"}
            </p>
            <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
              {"Nobody's posted yet. The feed is yours for the taking."}
            </p>
          </div>
        ) : (
          <div className="pt-10">
            {hero && (
              <section className="group relative grid bg-[var(--m-card)] transition-colors hover:bg-[var(--m-panel)] lg:grid-cols-[1.05fr_1fr]">
                <StatusBadge
                  status="LATEST DROP"
                  className="absolute top-5 right-5 z-[var(--m-z-content)]"
                />
                <Link
                  href={hrefOf(hero)}
                  className="relative z-[var(--m-z-content)] block aspect-[16/10] overflow-hidden bg-[var(--m-panel)]"
                >
                  <HeroCover post={hero} />
                </Link>
                <div className="flex flex-col justify-center p-5 sm:p-10">
                  <div className="mb-2">
                    <Category>{catOf(hero)}</Category>
                  </div>
                  <h1 className="font-display text-[32px] leading-[1.04] font-bold tracking-[-0.02em] text-balance transition-colors group-hover:text-[var(--m-accent)] md:text-[40px]">
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
                  {/* Same meta anatomy as the feed cards (owner call): handle
                      left, [short date · comments · rating] pushed RIGHT — no
                      dots, no views, ml-auto keeps the split on mobile too. */}
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-[12px] text-[var(--m-muted)]">
                    <Link
                      href={userHref(hero.author.userName ?? "")}
                      className="relative z-[var(--m-z-content)] text-[var(--m-muted)] transition-colors hover:text-[var(--m-accent)]"
                    >
                      @{hero.author.userName}
                    </Link>
                    <span className="ml-auto flex items-center gap-4">
                      <span className="flex items-center gap-1 tabular-nums">
                        {formatDateShort(hero.createdAtUtc)}
                      </span>
                      <Metric kind="comments" value={hero.comments} />
                      <Metric kind="rating" value={hero.rating} />
                    </span>
                  </div>
                </div>
              </section>
            )}

            {visibleGrid.length > 0 && (
              <>
                <div className="pt-10 pb-6">
                  <Label>POSTS</Label>
                </div>
                <section className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
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
              </>
            )}

            {query.isFetchingNextPage && <Loading inline section />}
            {query.hasNextPage && <div ref={sentinelRef} className="h-20" />}
          </div>
        )}
      </main>
    </div>
  );
}
