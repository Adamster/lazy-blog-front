"use client";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export type PostsView = "all" | "published" | "drafts";

interface PostsFilterProps {
  view: PostsView;
  onChange: (view: PostsView) => void;
}

// Author-only. Each button toggles — clicking the active one clears back to `all`.
export function PostsFilter({ view, onChange }: PostsFilterProps) {
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
        } mono-focus`}
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
        } mono-focus`}
      >
        <EyeSlashIcon className="size-3.5" />
      </button>
    </div>
  );
}
