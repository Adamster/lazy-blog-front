"use client";

import {
  ArrowTopRightOnSquareIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { TabNav, type TabItem } from "@/shared/ui";
import type { ProfileTab } from "./profile-tabs";

const TABS: TabItem[] = [
  { id: "profile", icon: UserIcon, label: "Profile" },
  { id: "security", icon: LockClosedIcon, label: "Security" },
];

interface EditProfileTopBarProps {
  current: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
  profileHref: string;
}

export function EditProfileTopBar({
  current,
  onSelect,
  profileHref,
}: EditProfileTopBarProps) {
  return (
    <div className="mx-[calc(50%-50vw)] w-screen bg-[var(--m-card)]">
      <div className="mx-auto flex max-w-[1240px] items-center px-6 py-5 md:px-10">
        <TabNav
          tabs={TABS}
          current={current}
          onSelect={(id) => onSelect(id as ProfileTab)}
          panelIdPrefix="panel-"
        />

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
