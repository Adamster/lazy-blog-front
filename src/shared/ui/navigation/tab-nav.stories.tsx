import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  UserIcon,
  LockClosedIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { TabNav, type TabItem } from "./tab-nav";

const PROFILE_TABS: TabItem[] = [
  { id: "profile", icon: UserIcon, label: "Profile" },
  { id: "security", icon: LockClosedIcon, label: "Security" },
];

const THREE_TABS: TabItem[] = [
  { id: "profile", icon: UserIcon, label: "Profile" },
  { id: "security", icon: LockClosedIcon, label: "Security" },
  { id: "notifications", icon: BellIcon, label: "Notifications" },
];

function InteractiveTabNav({ tabs }: { tabs: TabItem[] }) {
  const [current, setCurrent] = useState(tabs[0].id);
  return <TabNav tabs={tabs} current={current} onSelect={setCurrent} />;
}

const meta = {
  title: "Navigation/TabNav",
  component: TabNav,
  args: {
    tabs: PROFILE_TABS,
    current: "profile",
    onSelect: () => {},
  },
} satisfies Meta<typeof TabNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First tab active — the default edit-profile state. */
export const ProfileActive: Story = {};

/** Second tab active — Security selected. */
export const SecurityActive: Story = {
  args: { current: "security" },
};

/** Three-tab variant — extended nav band. */
export const ThreeTabs: Story = {
  args: { tabs: THREE_TABS, current: "profile" },
};

/** Clicking a box switches the active tab. */
export const Interactive: Story = {
  render: () => <InteractiveTabNav tabs={PROFILE_TABS} />,
};

/** Three-tab interactive variant. */
export const InteractiveThree: Story = {
  render: () => <InteractiveTabNav tabs={THREE_TABS} />,
};
