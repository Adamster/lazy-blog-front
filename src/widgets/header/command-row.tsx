"use client";

import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";

const cmdBase =
  "flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12px] whitespace-nowrap transition-colors hover:bg-[var(--m-panel)]";
const cmdTone = "text-[var(--m-fg)] hover:text-[var(--m-accent)]";
const cmdDangerTone = "text-[var(--m-error)] hover:text-[var(--m-error)]";

function Caret({ danger = false }: { danger?: boolean }) {
  return (
    <span aria-hidden className={danger ? "" : "text-[var(--m-accent)]"}>
      &gt;
    </span>
  );
}

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

export function MenuGroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)]">
      {children}
    </div>
  );
}

interface CommandRowProps {
  children: ReactNode;
  trailing?: ReactNode;
  danger?: boolean;
  /** Tab-reachable only when the menu is open. */
  tabbable: boolean;
}

function rowClass(danger: boolean) {
  return `${cmdBase} ${danger ? cmdDangerTone : cmdTone}`;
}

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
