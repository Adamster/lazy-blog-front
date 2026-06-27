import type { Meta, StoryObj } from "@storybook/react-vite";
import { MatrixText } from "./matrix-text";

const meta = {
  title: "Effects/MatrixText",
  component: MatrixText,
  args: { text: "WAKE UP NEO" },
} satisfies Meta<typeof MatrixText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Scrambles forever — the default idle state for empty sections. */
export const Loop: Story = {
  args: { trigger: "loop" },
};

/** Rests as plain text; one decode pass on pointer-enter or focus. */
export const Hover: Story = {
  args: { trigger: "hover" },
};

/** Rests as plain text; one decode pass when first scrolled into view. */
export const Scroll: Story = {
  args: { trigger: "scroll" },
};

/** Custom speed and hold duration. */
export const FastDecode: Story = {
  args: { trigger: "loop", speed: 20, holdMs: 800, scrambleMs: 600 },
};
