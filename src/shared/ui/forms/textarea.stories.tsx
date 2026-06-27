import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";

const meta = {
  title: "Forms/Textarea",
  component: Textarea,
  args: { label: "BIOGRAPHY" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: { label: "BIOGRAPHY", required: true },
};

/** Shows the floating-label float via uncontrolled defaultValue. */
export const Filled: Story = {
  args: {
    label: "BIOGRAPHY",
    defaultValue:
      "// Senior developer, terminal aesthetics enthusiast. Building NOT LAZY in the open.",
  },
};

export const WithError: Story = {
  args: {
    label: "SUMMARY",
    error: "Summary must be at least 20 characters",
  },
};

export const TallRows: Story = {
  args: { label: "POST BODY", rows: 6 },
};
