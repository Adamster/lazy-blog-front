"use client";

import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { useAllPosts } from "@/features/post/model/use-all-posts";
import { BrutalPostsList } from "@/features/post/ui/posts-list-brutal";
import { BrutalTagBar } from "@/features/tag/ui/tag-bar-brutal";
import { HomeStats } from "@/widgets/home-stats";

export default function HomePageRedesign() {
  const query = useAllPosts();

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  const posts = query.data?.pages?.flat() || [];

  return (
    <div className="px-6 py-10">
      <header className="border-ink dark:border-paper mb-10 border-b-2 pb-6">
        <h1 className="font-display text-[clamp(2.5rem,9vw,5rem)] leading-[0.92] font-bold tracking-tight">
          notlazy<span className="text-acid">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-xs font-medium tracking-[0.22em] text-zinc-500 uppercase dark:text-zinc-400">
          Dispatches from the Lazyverse — read, vote, procrastinate
          productively.
        </p>
      </header>

      <BrutalTagBar />

      <HomeStats />

      <BrutalPostsList query={query} posts={posts} />
    </div>
  );
}
