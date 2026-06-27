import type { Meta, StoryObj } from "@storybook/react-vite";
import { Loading, Spinner } from "./loading";

const meta = {
  title: "Feedback/Loading",
  component: Loading,
  argTypes: {
    inline: { control: "boolean" },
    section: { control: "boolean" },
  },
  args: { inline: false, section: false },
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full-page block — fills the content area below the header. */
export const Block: Story = {
  args: { inline: false },
};

/** Inline centered spinner for within a section. */
export const Inline: Story = {
  args: { inline: true },
};

/** Inline with section offset (`mt-5` instead of `my-6`). */
export const InlineSection: Story = {
  name: "Inline (section offset)",
  args: { inline: true, section: true },
};

/** The bare ASCII spinner glyph at multiple sizes. */
export const SpinnerSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner className="text-[12px] text-[var(--m-muted2)]" />
      <Spinner className="text-[14px] text-[var(--m-accent)]" />
      <Spinner className="text-[20px] text-[var(--m-fg)]" />
      <Spinner className="text-[32px] text-[var(--m-accent)]" />
    </div>
  ),
};
