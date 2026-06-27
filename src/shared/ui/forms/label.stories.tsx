import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";

const meta = {
  title: "Forms/Label",
  component: Label,
  args: { children: "PUBLICATIONS" },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Comments: Story = {
  args: { children: "COMMENTS" },
};

export const WithCaret: Story = {
  args: { children: "MOST ACTIVE USER", caret: true },
};

export const Uppercase: Story = {
  args: { children: "latest drop", uppercase: true },
};

export const Muted: Story = {
  args: { children: "DRAFT", className: "mono-label text-[var(--m-muted2)]" },
};
