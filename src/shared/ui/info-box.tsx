import type { ReactNode } from "react";

/**
 * Quote / info box — a short note (password requirements, form hints). On-system:
 * a 2px accent left edge + a faint `accent/[0.06]` wash + caption-12 / 1.6 muted
 * text. The OUTER margin is the caller's (it varies per surface — `mt-4` between
 * fields, `mb-4` above a field, etc.), passed via `className`.
 */
export function InfoBox({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-l-2 border-l-[var(--m-accent)] bg-[var(--m-accent)]/[0.06] px-4 py-3 text-[12px] leading-[1.6] text-[var(--m-muted)] ${className}`}
    >
      {children}
    </div>
  );
}
