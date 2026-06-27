import type { Meta, StoryObj } from "@storybook/react-vite";
import { InfoBox } from "./info-box";

const meta = {
  title: "Feedback/InfoBox",
  component: InfoBox,
  argTypes: {
    children: { control: "text" },
  },
  args: {
    children:
      "Password must be at least 8 characters and include one uppercase letter.",
  },
} satisfies Meta<typeof InfoBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MultiLine: Story = {
  args: {
    children:
      "Your post will be visible to all readers once published. You can change visibility at any time from the composer settings.",
  },
};

/** Two boxes stacked — mirrors how they appear between form fields. */
export const Stacked: Story = {
  render: () => (
    <div className="max-w-[400px] space-y-4">
      <InfoBox>Hint: a strong, memorable title gets more reach.</InfoBox>
      <InfoBox>Tags help readers discover your post in search.</InfoBox>
    </div>
  ),
};
