import type { ReactNode } from "react";

// Shared layout helpers for the /brand tabs — one source, don't fork per-tab.

export function Section({
  index,
  title,
  intro,
  children,
}: {
  index: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t-2 border-[var(--m-line)] pt-10">
      <div className="text-[11px] tracking-[0.12em] text-[var(--m-muted2)]">
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
        className={`mb-4 text-[11px] tracking-[0.12em] ${
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
      <div className="mb-2.5 text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
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
