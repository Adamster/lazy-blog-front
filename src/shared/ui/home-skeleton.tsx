import { Skeleton } from "./skeleton";

/**
 * Layout-matching loading shell for the home feed — mirrors `home-page.tsx`'s
 * shape (full-bleed stats band, `// PUBLICATIONS` rule, 16:10 hero, 3-col card
 * grid) so the route's loading boundary holds the SAME geometry the feed renders
 * into. No centred full-screen spinner swap → the navigation reads as instant
 * (no "refresh" flash) and there's no CLS when the cached feed paints in.
 *
 * Purely presentational — it touches no cache, so it can't affect data freshness
 * (post-vote / rating updates are unchanged).
 */
export function HomeSkeleton() {
  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
      aria-hidden="true"
    >
      <main className="mx-auto max-w-[1240px] px-10 pb-10">
        {/* Stats band — full-bleed, card-filled (matches home) */}
        <section className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-10 py-10 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="hidden first:block lg:block">
                <Skeleton className="h-2 w-1/3" />
                <Skeleton className="mt-4 h-[30px] w-3/4" />
                <Skeleton className="mt-4 h-2.5 w-1/2" />
              </div>
            ))}
          </div>
        </section>

        {/* `// PUBLICATIONS` rule */}
        <div className="flex items-center pt-10 pb-6">
          <Skeleton className="h-2.5 w-28" />
        </div>

        {/* Hero — 16:10 cover + lead copy */}
        <section className="grid bg-[var(--m-card)] lg:grid-cols-[1.05fr_1fr]">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="flex flex-col justify-center p-8 lg:p-[34px]">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-2 h-9 w-5/6" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
            <Skeleton className="mt-6 h-2.5 w-2/5" />
          </div>
        </section>

        {/* Card grid */}
        <section className="mt-7 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="flex flex-col bg-[var(--m-card)]">
              <Skeleton className="aspect-[16/10] w-full" />
              <div className="flex flex-col p-5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="mt-2 h-4 w-4/5" />
                <Skeleton className="mt-6 h-2.5 w-3/5" />
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
