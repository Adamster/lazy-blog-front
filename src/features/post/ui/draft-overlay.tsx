import { EyeSlashIcon } from "@heroicons/react/24/outline";

interface DraftOverlayProps {
  /** Icon scale: `card` (profile feed cover) = 32px · `page` (post cover) = 40px. */
  size?: "card" | "page";
  /**
   * Let clicks fall through to an underlying link (the feed card's stretched
   * title link, so the cover stays a post link). The post page has no link
   * under the cover, so it stays interactive (the default).
   */
  pointerThrough?: boolean;
}

/**
 * Draft / unpublished marker — the ONE treatment (CLAUDE.md): a dimmed cover
 * overlay (`--m-bg`/70) with a crossed-out eye + `Unpublished` label. Shown on
 * the post-page cover and the author's own profile feed cards — only the author
 * ever sees drafts. Caller provides the `relative` positioned cover wrapper.
 */
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
