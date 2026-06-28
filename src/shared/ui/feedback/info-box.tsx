import type { ReactNode } from "react";

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
