import type { ReactNode } from "react";

interface ConsoleProps {
  title: string;
  children: ReactNode;
  className?: string;
}

// Shared by Console + the header menu so the window chrome stays identical.
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
