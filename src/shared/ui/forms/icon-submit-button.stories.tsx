import type { Meta, StoryObj } from "@storybook/react-vite";
import { PaperAirplaneIcon, CheckIcon } from "@heroicons/react/24/solid";
import { IconSubmitButton } from "./icon-submit-button";

const meta = {
  title: "Forms/IconSubmitButton",
  component: IconSubmitButton,
  args: { label: "PUBLISH POST" },
} satisfies Meta<typeof IconSubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default glyph: RocketLaunchIcon (publish / send). */
export const Default: Story = {};

/** Save-draft variant — check icon, different label. */
export const SaveDraft: Story = {
  args: { label: "SAVE DRAFT", icon: CheckIcon },
};

/** Send-comment variant — paper-airplane icon. */
export const Send: Story = {
  args: { label: "SEND COMMENT", icon: PaperAirplaneIcon },
};

/** Pending: rocket swaps for the spinner, button disables. */
export const Pending: Story = {
  args: { pending: true },
};

/** Disabled independent of pending (e.g. empty form). */
export const Disabled: Story = {
  args: { disabled: true },
};
