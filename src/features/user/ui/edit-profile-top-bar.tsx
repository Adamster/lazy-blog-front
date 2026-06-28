"use client";

import {
  ArrowTopRightOnSquareIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { TabNav, type TabItem } from "@/shared/ui";
import type { ProfileTab } from "./profile-tabs";

/** The two profile sections, rendered as the composer-style tab boxes. */
const TABS: TabItem[] = [
  { id: "profile", icon: UserIcon, label: "Profile" },
  { id: "security", icon: LockClosedIcon, label: "Security" },
];

interface EditProfileTopBarProps {
  current: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
  /** Link to the viewer's public profile — the RIGHT-side ↗ view button. */
  profileHref: string;
}

/**
 * Edit-profile command band — mirrors {@link ComposerTopBar}: ONE full-bleed
 * `--m-card` band, inner `max-w-[1240px] px-10 py-5` row. LEFT: the two
 * free-switch tab boxes (P / S) via {@link TabNav}. RIGHT: a ↗ link to the
 * viewer's public profile (`mono-icon-btn`, the SAME view-live treatment as the
 * composer's View-post button) — replacing the old `// EDIT PROFILE` eyebrow.
 * No Cancel: you leave via the header or the ↗ profile link.
 */
export function EditProfileTopBar({
  current,
  onSelect,
  profileHref,
}: EditProfileTopBarProps) {
  return (
    <div className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
      <div className="mx-auto flex max-w-[1240px] items-center px-6 py-5 md:px-10">
        {/* LEFT — the free-switch tab boxes (P / S) */}
        <TabNav
          tabs={TABS}
          current={current}
          onSelect={(id) => onSelect(id as ProfileTab)}
          panelIdPrefix="panel-"
        />

        {/* RIGHT — ↗ view the viewer's public profile */}
        <a
          href={profileHref}
          aria-label="View profile"
          title="View your profile"
          className={`mono-icon-btn mono-focus ml-auto size-9`}
        >
          <ArrowTopRightOnSquareIcon className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
