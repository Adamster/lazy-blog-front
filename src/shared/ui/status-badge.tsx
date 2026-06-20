import { SparklesIcon, MapPinIcon } from "@heroicons/react/24/solid";

export type Status = "LATEST DROP" | "PINNED";

interface StatusBadgeProps {
  status: Status;
  /** Extra utilities (e.g. positioning) merged onto the badge. */
  className?: string;
}

/**
 * Accent-chip status badge (`LATEST DROP` / `PINNED`) with leading icon, shown
 * on the home hero and the post header. Same `--m-dim` chip treatment in both.
 */
export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const Icon = status === "PINNED" ? MapPinIcon : SparklesIcon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-[var(--m-dim)] px-2.5 py-2 text-[11px] leading-none font-semibold tracking-[0.06em] text-[var(--m-fg)] uppercase${
        className ? ` ${className}` : ""
      }`}
    >
      <Icon className="size-3 shrink-0" />
      {status}
    </span>
  );
}
