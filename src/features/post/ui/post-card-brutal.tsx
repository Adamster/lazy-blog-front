import {
  DisplayPostResponse,
  UserPostItem,
  UserResponse,
} from "@/shared/api/openapi";
import { Image } from "@heroui/react";
import Link from "next/link";
import {
  PostDetailsComments,
  PostDetailsRating,
  PostDetailsViews,
} from "@/features/post/ui/post-details";
import { formatDate2 } from "@/shared/lib/utils";

interface IProps {
  post: DisplayPostResponse | UserPostItem;
  author: UserResponse;
  featured?: boolean;
}

function CoverPlaceholder({ title }: { title: string }) {
  return (
    <div className="bg-acid flex aspect-video w-full items-center justify-center">
      <span className="font-display text-ink text-6xl font-bold select-none">
        {title?.charAt(0)?.toUpperCase() || "•"}
      </span>
    </div>
  );
}

export function BrutalPostCard({ post, author, featured = false }: IProps) {
  const href = `/${author.userName}/${post.slug}`;

  return (
    <Link
      href={href}
      className={`group border-ink bg-paper text-ink hover:bg-ink hover:text-paper dark:border-paper dark:bg-ink dark:text-paper dark:hover:bg-paper dark:hover:text-ink relative flex h-full flex-col border-2 transition-colors duration-150 ${
        featured ? "p-6 sm:p-8" : "p-5"
      }`}
    >
      {!post.isPublished && (
        <span className="bg-acid text-ink absolute top-0 right-0 z-10 px-2 py-0.5 text-xs font-bold tracking-wider uppercase">
          Draft
        </span>
      )}

      <div className="mb-4 border-2 border-current">
        {post.coverUrl ? (
          <Image
            removeWrapper
            radius="none"
            className="aspect-video w-full object-cover"
            src={post.coverUrl}
            alt={post.title}
          />
        ) : (
          <CoverPlaceholder title={post.title} />
        )}
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-[0.15em] text-zinc-500 uppercase group-hover:text-current dark:text-zinc-400">
        <span>@{author.userName}</span>
        <span aria-hidden>·</span>
        <span>{formatDate2(post.createdAtUtc)}</span>
      </div>

      <h2
        className={`font-display leading-[1.02] font-bold tracking-tight ${
          featured ? "text-[clamp(1.75rem,5vw,3rem)]" : "text-2xl"
        }`}
      >
        {post.title}
      </h2>

      {post.summary && (
        <p
          className={`mt-3 leading-relaxed text-zinc-600 group-hover:text-current dark:text-zinc-300 ${
            featured ? "max-w-2xl text-sm sm:text-base" : "line-clamp-3 text-sm"
          }`}
        >
          {post.summary}
        </p>
      )}

      <div className="mt-auto flex items-center gap-4 pt-5 text-sm">
        <PostDetailsViews views={post.views} />
        <PostDetailsComments comments={post.comments} />
        <PostDetailsRating rating={post.rating} />
        <span className="font-display ml-auto text-sm font-bold opacity-0 transition-opacity group-hover:opacity-100">
          Read →
        </span>
      </div>
    </Link>
  );
}
