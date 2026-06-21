import type { ReactNode } from "react";

interface ConsoleProps {
  /** Window title in the title bar (e.g. "stacktrace.log"). */
  title: string;
  /** Terminal body — monospace 11px content. */
  children: ReactNode;
  className?: string;
}

/**
 * Console title bar — the two square "traffic light" close/minimise marks + a
 * filename/label. Shared by {@link Console} and the header menu (a faux terminal
 * window too) so the window chrome stays identical. `trailing` slots extra
 * content after the title (e.g. a blinking terminal cursor).
 */
export function ConsoleTitleBar({
  title,
  trailing,
  className = "",
}: {
  title: string;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 border-b-2 border-[var(--m-dim)] px-3 py-2 ${className}`}
    >
      <span
        aria-hidden="true"
        className="size-2 border-2 border-[var(--m-error)]"
      />
      <span
        aria-hidden="true"
        className="size-2 border-2 border-[var(--m-dim)]"
      />
      <span className="ml-1 text-[12px] tracking-[0.06em] text-[var(--m-muted2)]">
        {title}
      </span>
      {trailing}
    </div>
  );
}

/**
 * Faux terminal window — a 2px square frame with a {@link ConsoleTitleBar} over
 * a monospace body. Used for the error page's `stacktrace.log`; reusable
 * anywhere a terminal panel reads well.
 */
export function Console({ title, children, className = "" }: ConsoleProps) {
  return (
    <div
      className={`border-2 border-[var(--m-dim)] bg-[var(--m-card)] ${className}`}
    >
      <ConsoleTitleBar title={title} />
      <div className="px-3 py-3 text-[12px] leading-[1.6] break-words text-[var(--m-muted)]">
        {children}
      </div>
    </div>
  );
}
