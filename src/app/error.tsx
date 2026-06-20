"use client";

import Link from "next/link";
import { useEffect } from "react";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="mono-scope flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--m-bg)] px-10 text-center text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <div className="mono-label">{"// ERROR"}</div>
      <h2 className="font-display text-[32px] leading-none font-bold tracking-[-0.02em]">
        A glitch in the Lazyverse…
      </h2>
      <p className="max-w-[46em] text-[14px] leading-[1.6] text-[var(--m-muted)]">
        {error?.message || "Unknown error"}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className={`mono-cta inline-flex h-9 items-center justify-center px-4 text-[14px] font-bold tracking-[0.06em] ${focusRing}`}
        >
          Try again
        </button>
        <Link
          href="/"
          className={`mono-btn-outline inline-flex h-9 items-center justify-center px-4 text-[14px] font-semibold tracking-[0.06em] ${focusRing}`}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
