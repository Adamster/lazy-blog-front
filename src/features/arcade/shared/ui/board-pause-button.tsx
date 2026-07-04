"use client";

import { PauseIcon, PlayIcon } from "@heroicons/react/24/outline";

/**
 * MOBILE-ONLY pause toggle (`sm:hidden`) — phones have no Space bar, so the
 * board carries one while a run is live. Top-LEFT corner (the top-right slot
 * belongs to the fullscreen toggle on the overlay screens); z-[2] keeps it
 * above the pause scrim's z-[1], so the same button also RESUMES. Desktop
 * stays clean per the no-controls-over-live-gameplay call — Space is the key.
 */
export function BoardPauseButton({
  paused,
  onToggle,
}: {
  paused: boolean;
  onToggle: () => void;
}) {
  const Icon = paused ? PlayIcon : PauseIcon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={paused ? "Resume" : "Pause"}
      className="mono-icon-btn mono-focus absolute top-5 left-5 z-[2] size-9 sm:hidden"
    >
      <Icon className="size-5" />
    </button>
  );
}
