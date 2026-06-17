"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DisplayPostResponse, UserPostItem } from "@/shared/api/openapi";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loading } from "@/shared/ui/loading";
import { BrutalPostCard } from "./post-card-brutal";

interface BrutalPostsListProps {
  posts: (DisplayPostResponse | UserPostItem)[];
  query: UseInfiniteQueryResult<InfiniteData<any, unknown>, Error>;
}

export function BrutalPostsList({ query, posts }: BrutalPostsListProps) {
  const observerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!observerRef.current || !query.hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && query.fetchNextPage(),
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [query, query.fetchNextPage, query.hasNextPage]);

  if (!posts.length) {
    return (
      <div className="border-ink dark:border-paper border-2 border-dashed p-10 text-center">
        <p className="font-display text-2xl font-bold">Nothing here yet.</p>
        <p className="mt-2 text-sm tracking-[0.15em] text-zinc-500 uppercase dark:text-zinc-400">
          The Lazyverse is quiet. Be the first to break the silence.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <>
      {featured && (
        <BrutalPostCard
          post={featured}
          author={(featured as DisplayPostResponse).author}
          featured
        />
      )}

      {rest.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {rest.map((post, index) => (
            <motion.div
              key={post.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.16,
                delay: Math.min(index * 0.04, 0.32),
              }}
            >
              <BrutalPostCard
                post={post}
                author={(post as DisplayPostResponse).author}
              />
            </motion.div>
          ))}
        </div>
      )}

      {query.isFetchingNextPage && <Loading inline />}
      {query.hasNextPage && <div ref={observerRef} className="h-20" />}
    </>
  );
}
