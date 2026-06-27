import type { Meta, StoryObj } from "@storybook/react-vite";
import { GlitchText } from "./glitch-text";

const meta = {
  title: "Effects/GlitchText",
  component: GlitchText,
  args: { children: "SYSTEM ERROR" },
} satisfies Meta<typeof GlitchText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default glitch jitter — two ghost copies (accent / error) flash on a beat. */
export const Default: Story = {};

/** With blinking block caret appended — as used on the 404/500 error pages. */
export const WithCaret: Story = {
  args: { caret: true },
};

/** Larger display size via className. */
export const DisplaySize: Story = {
  args: {
    children: "404",
    className: "text-[40px] font-display font-bold leading-none",
  },
};
