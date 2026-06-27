import type { Meta, StoryObj } from "@storybook/react-vite";
import { Category } from "./category";

const meta = {
  title: "Data Display/Category",
  component: Category,
  args: { children: "ENGINEERING" },
} satisfies Meta<typeof Category>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Engineering: Story = {};
export const Design: Story = { args: { children: "DESIGN" } };
export const Opinion: Story = { args: { children: "OPINION" } };
export const Tutorial: Story = { args: { children: "TUTORIAL" } };

/** Multiple categories stacked — e.g. above a title on a post card. */
export const Stacked: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Category>ENGINEERING</Category>
      <Category>TUTORIAL</Category>
      <Category>OPEN SOURCE</Category>
    </div>
  ),
};
