"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { TabNav, type TabItem } from "@/shared/ui";
import type { ProfileTab } from "./profile-tabs";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

/** The two profile sections, rendered as the composer-style tab boxes. */
const TABS: TabItem[] = [
  { id: "profile", marker: "P", label: "Profile" },
  { id: "security", marker: "S", label: "Security" },
];

interface EditProfileTopBarProps {
  current: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
  /** Where the ✕ Cancel abort link exits to (the viewer's profile / home). */
  cancelHref: string;
}

/**
 * Edit-profile command band — mirrors {@link ComposerTopBar}: ONE full-bleed
 * `--m-card` band, inner `max-w-[1240px] px-10 py-5` row. LEFT: a ✕ Cancel abort
 * link + a 2px divider + the two free-switch tab boxes (P / S) via
 * {@link TabNav}. RIGHT: an `// EDIT PROFILE` eyebrow. Cancel is an ABORT, so it
 * carries a close ✕ glyph, never a directional arrow (arrows mark navigation —
 * that's the tab boxes), exactly like the composer's Cancel.
 */
export function EditProfileTopBar({
  current,
  onSelect,
  cancelHref,
}: EditProfileTopBarProps) {
  return (
    <div className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
      <div className="mx-auto flex max-w-[1240px] items-center px-10 py-5">
        {/* LEFT — ✕ Cancel · 2px divider · tab boxes */}
        <div className="flex items-center gap-5">
          <a
            href={cancelHref}
            aria-label="Cancel"
            className={`inline-flex items-center gap-2.5 text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-colors hover:text-[var(--m-muted)] ${focusRing}`}
          >
            <XMarkIcon aria-hidden="true" className="size-3.5" />
            <span className="hidden md:inline">Cancel</span>
          </a>
          <span aria-hidden="true" className="h-5 w-0.5 bg-[var(--m-dim)]" />
          <TabNav
            tabs={TABS}
            current={current}
            onSelect={(id) => onSelect(id as ProfileTab)}
            panelIdPrefix="panel-"
          />
        </div>

        <span className="mono-label ml-auto text-[var(--m-muted2)]">
          {"// EDIT PROFILE"}
        </span>
      </div>
    </div>
  );
}
