import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { UnderlineTabs, type UnderlineTabItem } from "./underline-tabs";

const REACTION_TABS: readonly UnderlineTabItem[] = [
  { id: "emoji", label: "EMOJI" },
  { id: "gif", label: "GIF" },
  { id: "sticker", label: "STICKER" },
];

const SECTION_TABS: readonly UnderlineTabItem[] = [
  { id: "posts", label: "POSTS" },
  { id: "comments", label: "COMMENTS" },
  { id: "likes", label: "LIKES" },
];

function InteractiveUnderlineTabs({
  tabs,
  baseline,
}: {
  tabs: readonly UnderlineTabItem[];
  baseline?: boolean;
}) {
  const [current, setCurrent] = useState(tabs[0].id);
  return (
    <UnderlineTabs
      tabs={tabs}
      current={current}
      onSelect={setCurrent}
      ariaLabel="Content tabs"
      baseline={baseline}
    />
  );
}

const meta = {
  title: "Navigation/UnderlineTabs",
  component: UnderlineTabs,
  args: {
    tabs: REACTION_TABS,
    current: "emoji",
    onSelect: () => {},
    ariaLabel: "Tabs",
  },
} satisfies Meta<typeof UnderlineTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Reaction-picker tabs — first tab active. */
export const EmojiActive: Story = {};

/** Second tab active. */
export const GifActive: Story = {
  args: { current: "gif" },
};

/** Third tab active. */
export const StickerActive: Story = {
  args: { current: "sticker" },
};

/** Section tabs — profile Publications / Comments / Likes band. */
export const SectionTabs: Story = {
  args: { tabs: SECTION_TABS, current: "posts", ariaLabel: "Profile sections" },
};

/**
 * No baseline — renders only the active-tab accent underline; use under a header
 * that already carries a divider so the row doesn't double up.
 */
export const NoBaseline: Story = {
  args: { baseline: false },
};

/** Clicking a tab switches the active underline. */
export const Interactive: Story = {
  render: () => <InteractiveUnderlineTabs tabs={REACTION_TABS} />,
};

/** Section tabs interactive. */
export const InteractiveSectionTabs: Story = {
  render: () => <InteractiveUnderlineTabs tabs={SECTION_TABS} />,
};
