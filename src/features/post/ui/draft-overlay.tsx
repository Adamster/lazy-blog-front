import { EyeSlashIcon } from "@heroicons/react/24/outline";

interface DraftOverlayProps {
  size?: "card" | "page";
  // Let clicks fall through to an underlying link (the feed card's stretched
  // title link); the post page has no such link, so it stays interactive.
  pointerThrough?: boolean;
}

// The ONE draft marker (CLAUDE.md). Caller provides the `relative` cover wrapper.
export function DraftOverlay({
  size = "page",
  pointerThrough = false,
}: DraftOverlayProps) {
  return (
    <div
      className={`absolute inset-0 z-[var(--m-z-content)] flex flex-col items-center justify-center gap-2.5 bg-[var(--m-bg)]/70 ${
        pointerThrough ? "pointer-events-none" : ""
      }`}
    >
      <EyeSlashIcon
        className={`${size === "card" ? "size-8" : "size-10"} text-[var(--m-fg)]`}
      />
      <span className="text-[11px] leading-none font-semibold tracking-[0.12em] text-[var(--m-fg)] uppercase">
        Unpublished
      </span>
    </div>
  );
}
