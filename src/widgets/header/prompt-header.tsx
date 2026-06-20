"use client";

import Link from "next/link";

interface PromptHeaderProps {
  userName?: string;
  open: boolean;
  onNavigate: () => void;
}

/** Terminal prompt header — `@user :~$ _` line atop the command menu. */
export function PromptHeader({
  userName,
  open,
  onNavigate,
}: PromptHeaderProps) {
  return (
    <div className="flex items-center border-b-2 border-[var(--m-dim)] px-4 py-2.5 text-[12px] tracking-[0.02em]">
      <Link
        href="/"
        onClick={onNavigate}
        aria-label="Home"
        tabIndex={open ? 0 : -1}
        className="min-w-0 truncate"
      >
        <span className="text-[var(--m-accent)]">@{userName ?? "guest"}</span>{" "}
        <span className="text-[var(--m-muted2)]">:~$</span>
      </Link>
      <span
        aria-hidden
        className="ml-1.5 shrink-0 text-[var(--m-accent)]"
        style={{ animation: "lzblink 1.1s steps(1) infinite" }}
      >
        _
      </span>
    </div>
  );
}
