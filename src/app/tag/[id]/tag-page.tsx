"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { snakeToTitle } from "@/shared/lib/utils";
import { Header } from "@/widgets/header";
import { Label, Category } from "@/shared/ui";
import { useViewMode } from "@/shared/providers/view-mode-provider";
import { useInfiniteScroll } from "@/shared/lib/use-infinite-scroll";
import { PostCardMono } from "@/features/post/ui/post-card-mono";
import { usePostsByTag } from "@/features/post/model/use-posts-by-tag";

export default function TagPage({ tag }: { tag: string }) {
  const tagName = snakeToTitle(tag);
  const query = usePostsByTag(tag);
  const reduceMotion = useReducedMotion();
  const { view } = useViewMode();

  const sentinelRef = useInfiniteScroll({
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetching: query.isFetchingNextPage,
  });

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  const posts = query.data?.pages?.flat() ?? [];

  return (
    <div
      className="mono-scope mx-[calc(50%-50vw)] min-h-screen w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <Header />

      <main className="mx-auto max-w-[1240px] px-10 pt-10 pb-10">
        {/* Tag header band — full-bleed, filled like the home/profile stats */}
        <section className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
          <div className="mx-auto max-w-[1240px] px-10 py-10">
            <div className="mb-2">
              <Category>tag</Category>
            </div>
            <h1 className="font-display text-[40px] leading-none font-bold tracking-[-0.02em] uppercase">
              {tagName}
            </h1>
            <p className="mt-4 max-w-[40em] text-[14px] leading-[1.6] text-[var(--m-muted)]">
              Looking for something interesting? You&rsquo;re in the right
              place. Dive in before your coffee gets cold.
            </p>
          </div>
        </section>

        {/* Publications */}
        <Label className="mono-label py-10">PUBLICATIONS</Label>

        {posts.length === 0 ? (
          <div className="border-2 border-[var(--m-line)] py-24 text-center">
            <p className="font-display text-[32px] leading-[1.04] font-bold tracking-[-0.02em]">
              {"// EMPTY FEED"}
            </p>
            <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
              No posts under {tagName} yet.
            </p>
          </div>
        ) : view === "grid" ? (
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
                <PostCardMono
                  post={p}
                  href={`/${p.author.userName}/${p.slug}`}
                  authorHandle={p.author.userName ?? undefined}
                  variant="grid"
                />
              </motion.div>
            ))}
          </section>
        ) : (
          <section className="flex flex-col gap-7">
            {posts.map((p) => (
              <PostCardMono
                key={p.id}
                post={p}
                href={`/${p.author.userName}/${p.slug}`}
                authorHandle={p.author.userName ?? undefined}
                variant="list"
              />
            ))}
          </section>
        )}

        {query.isFetchingNextPage && <Loading inline />}
        {query.hasNextPage && <div ref={sentinelRef} className="h-20" />}
      </main>
    </div>
  );
}
