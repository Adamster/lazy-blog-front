import type { ReactNode } from "react";

export function InfoBox({
  children,
  body = false,
  className = "",
}: {
  children: ReactNode;
  /** true = UI-body 14px text (FAQ answers, standalone callouts);
   *  default = caption 12px (inline info rows). */
  body?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`border-l-2 border-l-[var(--m-accent)] bg-[var(--m-accent)]/[0.06] px-4 py-3 leading-[1.6] text-[var(--m-muted)] ${
        body ? "text-[14px]" : "text-[12px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}
