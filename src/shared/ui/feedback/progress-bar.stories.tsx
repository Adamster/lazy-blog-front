import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressBar } from "./progress-bar";

const meta = {
  title: "Feedback/ProgressBar",
  component: ProgressBar,
  argTypes: {
    cells: { control: { type: "range", min: 5, max: 40, step: 1 } },
    label: { control: "text" },
  },
  args: { label: "Processing", cells: 20 },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoLabel: Story = {
  args: { label: undefined, cells: 20 },
};

export const Narrow: Story = {
  args: { label: "Uploading", cells: 12 },
};

export const Wide: Story = {
  args: { label: "Building", cells: 30 },
};

/** Multiple bars — e.g. a multi-step task panel. */
export const Multiple: Story = {
  render: () => (
    <div className="flex max-w-[420px] flex-col gap-4">
      <ProgressBar label="Uploading" cells={16} />
      <ProgressBar label="Processing" cells={20} />
      <ProgressBar label="Building" cells={24} />
    </div>
  ),
};
