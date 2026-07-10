// Collapsible Q&A — editorial rule-rows (the Lazy Cam design-file pattern):
// no boxes, each row opens with a 2px --m-dim top rule, the list closes with
// a bottom rule; the left marker flips + → − on open. Native
// <details>/<summary> (no JS, accessible), works on bg and panel bands alike.

import type { ReactNode } from "react";

export function QaItem({
  q,
  children,
  defaultOpen = false,
}: {
  q: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group border-t-2 border-[var(--m-dim)]"
      open={defaultOpen}
    >
      <summary className="mono-focus flex cursor-pointer list-none items-center gap-3 py-5 transition-colors hover:text-[var(--m-accent)] [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="shrink-0 text-[14px] text-[var(--m-accent)]"
        >
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
        <span className="flex-1 text-[14px] leading-[1.6] font-semibold">
          {q}
        </span>
      </summary>
      <div className="pb-5 pl-7 text-[14px] leading-[1.6] text-[var(--m-muted)]">
        {children}
      </div>
    </details>
  );
}

// The row list — rows carry their own top rule, the list closes with a bottom
// one.
export function QaList({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col border-b-2 border-[var(--m-dim)]">
      {children}
    </div>
  );
}

// Emphasis inside muted answer copy — lifts back to fg.
export function B({ children }: { children: ReactNode }) {
  return (
    <strong className="font-semibold text-[var(--m-fg)]">{children}</strong>
  );
}

export function QaLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="mono-focus text-[var(--m-accent)] underline underline-offset-2 transition-opacity hover:opacity-70"
    >
      {children}
    </a>
  );
}
