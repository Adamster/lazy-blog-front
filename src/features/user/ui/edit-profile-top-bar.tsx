"use client";

import { TabNav, type TabItem } from "@/shared/ui";
import type { ProfileTab } from "./profile-tabs";

/** The two profile sections, rendered as the composer-style tab boxes. */
const TABS: TabItem[] = [
  { id: "profile", marker: "P", label: "Profile" },
  { id: "security", marker: "S", label: "Security" },
];

interface EditProfileTopBarProps {
  current: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
}

/**
 * Edit-profile command band — mirrors {@link ComposerTopBar}: ONE full-bleed
 * `--m-card` band, inner `max-w-[1240px] px-10 py-5` row. LEFT: the two
 * free-switch tab boxes (P / S) via {@link TabNav}. RIGHT: an `// EDIT PROFILE`
 * eyebrow. No `← Back` and no Cancel — like the EDIT composer, you exit via the
 * header (nothing to abort), so the band carries navigation only.
 */
export function EditProfileTopBar({
  current,
  onSelect,
}: EditProfileTopBarProps) {
  return (
    <div className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
      <div className="mx-auto flex max-w-[1240px] items-center px-10 py-5">
        <TabNav
          tabs={TABS}
          current={current}
          onSelect={(id) => onSelect(id as ProfileTab)}
          panelIdPrefix="panel-"
        />
        <span className="mono-label ml-auto text-[var(--m-muted2)]">
          {"// EDIT PROFILE"}
        </span>
      </div>
    </div>
  );
}
