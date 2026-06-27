import type { Meta, StoryObj } from "@storybook/react-vite";
import { AsciiDivider, Callout } from "./prose-blocks";

const meta = {
  title: "Prose/ProseBlocks",
  component: AsciiDivider,
  decorators: [
    (Story) => (
      <div className="mono-prose" style={{ maxWidth: 600 }}>
        <p>Paragraph above the block element.</p>
        <Story />
        <p>Paragraph below the block element.</p>
      </div>
    ),
  ],
  args: { variant: "dots" },
  argTypes: {
    variant: { control: "inline-radio", options: ["dots", "slash"] },
  },
} satisfies Meta<typeof AsciiDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── AsciiDivider ────────────────────────────────────────────────────────────

export const DividerDots: Story = {
  args: { variant: "dots" },
};

export const DividerSlash: Story = {
  args: { variant: "slash" },
};

// ─── Callout ─────────────────────────────────────────────────────────────────

export const CalloutNote: StoryObj = {
  render: () => (
    <div className="mono-prose" style={{ maxWidth: 600 }}>
      <Callout type="note">
        This is an informational note. Use it to highlight important context
        without interrupting the reading flow.
      </Callout>
    </div>
  ),
};

export const CalloutWarn: StoryObj = {
  render: () => (
    <div className="mono-prose" style={{ maxWidth: 600 }}>
      <Callout type="warn">
        Destructive operation ahead — this cannot be undone. Double-check before
        proceeding.
      </Callout>
    </div>
  ),
};
