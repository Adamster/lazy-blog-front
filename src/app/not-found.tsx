import Link from "next/link";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

export default function NotFound() {
  return (
    <div
      className="mono-scope flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--m-bg)] px-10 text-center text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <div className="mono-label">{"// 404"}</div>
      <h2 className="font-display text-[46px] leading-none font-bold tracking-[-0.02em] tabular-nums">
        404
      </h2>
      <p className="max-w-[46em] text-[14px] leading-[1.6] text-[var(--m-muted)]">
        Couldn&apos;t find what you were looking for.
      </p>
      <Link
        href="/"
        className={`mono-cta inline-flex h-9 items-center justify-center px-4 text-[14px] font-bold tracking-[0.06em] ${focusRing}`}
      >
        Go home
      </Link>
    </div>
  );
}
