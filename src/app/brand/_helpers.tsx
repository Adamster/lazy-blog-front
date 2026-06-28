import type { ReactNode } from "react";

// Shared layout helpers for the /brand tabs — one source, don't fork per-tab.

// Offsets anchor jumps so a target clears the fixed 64px header bar.
const ANCHOR_OFFSET = "scroll-mt-[calc(var(--m-header-h)+24px)]";

export function Section({
  id,
  index,
  title,
  intro,
  children,
}: {
  id?: string;
  index: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`border-t-2 border-[var(--m-dim)] pt-10 ${ANCHOR_OFFSET}`}
    >
      <div className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
        {index} — {title}
      </div>
      {intro ? (
        <p className="mt-6 text-[14px] leading-[1.6] text-[var(--m-muted)]">
          {intro}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

// The layer band that opens each group of component stories in the storybook.
export function GroupBand({
  id,
  layer,
  title,
  intro,
}: {
  id: string;
  layer: string;
  title: string;
  intro: string;
}) {
  return (
    <div id={id} className={ANCHOR_OFFSET}>
      <div className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-accent)]">
        {`// LAYER · ${layer}`}
      </div>
      <h2 className="font-display mt-6 text-[32px] leading-none font-bold tracking-[-0.02em]">
        {title}
      </h2>
      <p className="mt-4 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        {intro}
      </p>
    </div>
  );
}

export function Panel({
  caption,
  tone = "accent",
  children,
  className = "",
}: {
  caption: string;
  tone?: "accent" | "muted";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[var(--m-card)] p-7 ${className}`}>
      <div
        className={`mb-4 text-[11px] leading-none tracking-[0.12em] ${
          tone === "accent"
            ? "text-[var(--m-accent)]"
            : "text-[var(--m-muted2)]"
        }`}
      >
        {caption}
      </div>
      {children}
    </div>
  );
}

export function State({
  caption,
  children,
  className = "",
}: {
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2.5 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] uppercase">
        {caption}
      </div>
      {children}
    </div>
  );
}

export function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-6 border-b-2 border-[var(--m-dim)] py-3">
      <div className="text-[14px] text-[var(--m-fg)]">{label}</div>
      <div className="text-[12px] tracking-[0.06em] whitespace-nowrap text-[var(--m-accent)] tabular-nums">
        {value}
      </div>
    </div>
  );
}
