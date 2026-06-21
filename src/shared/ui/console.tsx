import type { ReactNode } from "react";

interface ConsoleProps {
  /** Window title in the title bar (e.g. "stacktrace.log"). */
  title: string;
  /** Terminal body — monospace 11px content. */
  children: ReactNode;
  className?: string;
}

/**
 * Faux terminal window — a 2px square frame with a title bar (two square
 * "traffic light" marks + a filename) over a monospace body. Used for the error
 * page's `stacktrace.log`; reusable anywhere a terminal panel reads well.
 */
export function Console({ title, children, className = "" }: ConsoleProps) {
  return (
    <div
      className={`border-2 border-[var(--m-dim)] bg-[var(--m-card)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b-2 border-[var(--m-dim)] px-3 py-2">
        <span
          aria-hidden="true"
          className="size-2 border-2 border-[var(--m-error)]"
        />
        <span
          aria-hidden="true"
          className="size-2 border-2 border-[var(--m-dim)]"
        />
        <span className="ml-1 text-[11px] tracking-[0.06em] text-[var(--m-muted2)]">
          {title}
        </span>
      </div>
      <div className="px-3 py-3 text-[12px] leading-[1.6] break-words text-[var(--m-muted)]">
        {children}
      </div>
    </div>
  );
}
