"use client";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

/** Which slice of the author's own posts the profile feed is showing.
 *  `all` = no filter (the default — published + drafts mixed). */
export type PublicationsView = "all" | "published" | "drafts";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface PublicationsFilterProps {
  view: PublicationsView;
  onChange: (view: PublicationsView) => void;
}

/**
 * Author-only filter for the profile `// PUBLICATIONS` feed: published
 * (`EyeIcon`) and drafts (`EyeSlashIcon`). Each button TOGGLES — clicking the
 * active one again clears it back to `all` (the default, both dim = everything
 * shown), so there are three states: all / published-only / drafts-only.
 * On-system icon buttons (`mono-icon-btn size-9`): the active slice reads in
 * accent (border + icon), inactive stays dim. Real buttons with `aria-pressed`.
 * Shown ONLY to the page owner — other visitors never see it (and only ever see
 * published posts).
 */
export function PublicationsFilter({
  view,
  onChange,
}: PublicationsFilterProps) {
  return (
    <div
      className="flex items-center gap-3"
      role="group"
      aria-label="Filter posts"
    >
      <button
        type="button"
        onClick={() => onChange(view === "published" ? "all" : "published")}
        aria-pressed={view === "published"}
        aria-label="Show published posts"
        title="Published"
        className={`mono-icon-btn size-9 ${
          view === "published"
            ? "border-[var(--m-accent)] text-[var(--m-accent)]"
            : ""
        } ${focusRing}`}
      >
        <EyeIcon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange(view === "drafts" ? "all" : "drafts")}
        aria-pressed={view === "drafts"}
        aria-label="Show drafts"
        title="Drafts"
        className={`mono-icon-btn size-9 ${
          view === "drafts"
            ? "border-[var(--m-accent)] text-[var(--m-accent)]"
            : ""
        } ${focusRing}`}
      >
        <EyeSlashIcon className="size-3.5" />
      </button>
    </div>
  );
}
