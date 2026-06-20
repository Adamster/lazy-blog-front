import Link from "next/link";
import { GlitchText } from "@/shared/ui/glitch-text";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

export default function NotFound() {
  return (
    <div
      className="mono-scope flex min-h-screen w-full flex-col justify-center bg-[var(--m-bg)] px-10 py-14 text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-8 flex items-center gap-2.5 text-[11px] tracking-[0.14em] text-[var(--m-muted2)]">
          <span
            aria-hidden="true"
            className="inline-block size-[7px] bg-[var(--m-muted2)]"
          />
          PAGE_NOT_FOUND · 404
        </div>

        <h1 className="font-display text-[clamp(72px,13vw,100px)] leading-none font-bold tracking-[-0.04em] tabular-nums">
          <GlitchText>404</GlitchText>
        </h1>

        <p className="mt-6 max-w-[40ch] text-[14px] leading-[1.6] text-[var(--m-muted)]">
          {
            "This URL doesn't point to anything. Maybe it was moved, deleted, or never existed."
          }
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className={`mono-cta inline-flex h-9 items-center justify-center px-4 text-[14px] font-bold tracking-[0.06em] ${focusRing}`}
          >
            ← Go home
          </Link>
        </div>

        <div className="mt-10 text-[11px] tracking-[0.06em] text-[var(--m-muted2)]">
          {"// the sloth couldn't find it either"}
        </div>
      </div>
    </div>
  );
}
