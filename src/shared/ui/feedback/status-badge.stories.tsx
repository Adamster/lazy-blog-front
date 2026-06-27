import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./status-badge";

const meta = {
  title: "Feedback/StatusBadge",
  component: StatusBadge,
  argTypes: {
    status: {
      control: "inline-radio",
      options: ["LATEST DROP", "PINNED"],
    },
  },
  args: { status: "LATEST DROP" },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LatestDrop: Story = { args: { status: "LATEST DROP" } };
export const Pinned: Story = { args: { status: "PINNED" } };
