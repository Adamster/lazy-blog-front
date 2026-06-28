"use client";

import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";

// Terminal command rows: a `>` prompt + the command, hover highlights the line.
const cmdBase =
  "flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12px] whitespace-nowrap transition-colors hover:bg-[var(--m-panel)]";
const cmdTone = "text-[var(--m-fg)] hover:text-[var(--m-accent)]";
const cmdDangerTone = "text-[var(--m-error)] hover:text-[var(--m-error)]";

/** Accent `>` command prompt (muted to fg for destructive rows). */
function Caret({ danger = false }: { danger?: boolean }) {
  return (
    <span aria-hidden className={danger ? "" : "text-[var(--m-accent)]"}>
      &gt;
    </span>
  );
}

/**
 * Trailing `[ icon ]` on the account rows — bracketed like the toggles' `[ on ]`
 * so the whole right column reads uniformly; muted2 (same color as the icon).
 */
export function BracketIcon({
  Icon,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-[var(--m-muted2)]">
      [<Icon className="size-3.5" />]
    </span>
  );
}

/**
 * Console-comment group label (`// account`, `// settings`) above a block of
 * command rows — 11px / 0.12em muted2, line box pinned (`leading-none`) so it
 * renders at the label scale. One source so the two menu groups stay identical.
 */
export function MenuGroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
      {children}
    </div>
  );
}

interface CommandRowProps {
  children: ReactNode;
  /** Trailing slot (e.g. a `BracketIcon` or a `[ on ]` toggle indicator). */
  trailing?: ReactNode;
  /** Render the row in the error color (destructive actions like logout). */
  danger?: boolean;
  /** Tab-reachable only when the menu is open. */
  tabbable: boolean;
}

/** Shared terminal command line — used both as a link and as a button row. */
function rowClass(danger: boolean) {
  return `${cmdBase} ${danger ? cmdDangerTone : cmdTone}`;
}

/** Command row rendered as an internal `next/link`. */
export function CommandLink({
  href,
  onClick,
  tabbable,
  ariaLabel,
  children,
  trailing,
}: CommandRowProps & {
  href: string;
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={ariaLabel}
      className={rowClass(false)}
      tabIndex={tabbable ? 0 : -1}
    >
      <Caret />
      {children}
      {trailing}
    </Link>
  );
}

/** Command row rendered as a `button` (toggles, login, logout). */
export function CommandButton({
  onClick,
  danger = false,
  tabbable,
  disabled = false,
  title,
  children,
  trailing,
}: CommandRowProps & {
  onClick: () => void;
  /** Non-interactive + muted (a locked / unavailable command row). */
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${rowClass(danger)} disabled:pointer-events-none disabled:text-[var(--m-muted2)] disabled:opacity-60`}
      tabIndex={tabbable ? 0 : -1}
    >
      <Caret danger={danger} />
      {children}
      {trailing}
    </button>
  );
}
