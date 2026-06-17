"use client";

import Link from "next/link";
import { titleToSnake } from "@/shared/lib/utils";
import { useTags } from "@/features/tag/model/use-tags";

export function BrutalTagBar() {
  const { data } = useTags();
  const tags = data?.filter((tag) => tag.postCount > 0) ?? [];

  if (!tags.length) return null;

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.tagId}
          href={`/tag/${titleToSnake(tag.tag)}`}
          className="border-ink hover:bg-acid hover:text-ink dark:border-paper dark:hover:bg-acid dark:hover:text-ink flex items-center gap-1.5 border-2 px-3 py-1 text-xs font-bold tracking-wider uppercase transition-colors"
        >
          {tag.tag}
          <span className="opacity-50">{tag.postCount}</span>
        </Link>
      ))}
    </nav>
  );
}
