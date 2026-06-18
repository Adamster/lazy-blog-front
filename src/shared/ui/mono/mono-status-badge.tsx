import { SparklesIcon, MapPinIcon } from "@heroicons/react/24/solid";

export type MonoStatus = "LATEST DROP" | "PINNED";

interface MonoStatusBadgeProps {
  status: MonoStatus;
  /** Extra utilities (e.g. positioning) merged onto the badge. */
  className?: string;
}

/**
 * Accent-chip status badge (`LATEST DROP` / `PINNED`) with leading icon, shown
 * on the home hero and the post header. Same `--m-dim` chip treatment in both.
 */
export function MonoStatusBadge({
  status,
  className = "",
}: MonoStatusBadgeProps) {
  const Icon = status === "PINNED" ? MapPinIcon : SparklesIcon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-[var(--m-dim)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] text-[var(--m-fg)] uppercase${
        className ? ` ${className}` : ""
      }`}
    >
      <Icon className="size-3 shrink-0" />
      {status}
    </span>
  );
}
