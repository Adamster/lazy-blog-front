import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dot } from "./dot";

const meta = {
  title: "Data Display/Dot",
  component: Dot,
  args: {},
} satisfies Meta<typeof Dot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single middle-dot separator. */
export const Default: Story = {};

/**
 * Dots in context — a typical caption meta row with two separators.
 * The dot intentionally reads dimmer (`--m-muted2`) than the surrounding
 * label text to avoid competing with the actual content.
 */
export const InMetaRow: Story = {
  render: () => (
    <div className="flex items-center gap-2.5 text-[12px] text-[var(--m-muted)]">
      <span>@not_lazy</span>
      <Dot />
      <span>26 Jun 2026</span>
      <Dot />
      <span>3 min read</span>
    </div>
  ),
};
