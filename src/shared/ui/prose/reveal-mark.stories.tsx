import type { Meta, StoryObj } from "@storybook/react-vite";
import { RevealMark } from "./reveal-mark";

const meta = {
  title: "Prose/RevealMark",
  component: RevealMark,
  decorators: [
    (Story) => (
      <div className="mono-prose" style={{ maxWidth: 600 }}>
        <p>
          The experiment revealed that <Story /> was the key variable all along.
        </p>
      </div>
    ),
  ],
  args: { children: "the butler did it", variant: "blur" },
  argTypes: {
    variant: { control: "inline-radio", options: ["blur", "strike"] },
  },
} satisfies Meta<typeof RevealMark>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Blurred spoiler — click or focus to reveal. */
export const Blur: Story = {
  args: { variant: "blur", children: "the butler did it" },
};

/** Struck-out edit — a permanent static line-through, always visible. */
export const Strike: Story = {
  args: { variant: "strike", children: "the original text" },
};
