/**
 * Loading skeleton block — a square `--m-dim → --m-panel` shimmer (`.mono-skeleton`,
 * which falls back to a flat `--m-dim` block under `prefers-reduced-motion`).
 * Size it with utilities: `<Skeleton className="h-3 w-1/2" />`. Square geometry,
 * no radius.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`mono-skeleton block ${className}`} />
  );
}

/**
 * Composed example — a feed-card loading placeholder: a 40px avatar + handle
 * line, then the title and two summary lines. Shown in the /brand Components
 * SKELETON section; wiring into the real feed loading states is a follow-up.
 */
export function PostCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 bg-[var(--m-card)] p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 flex-none" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}
