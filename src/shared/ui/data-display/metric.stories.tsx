import type { Meta, StoryObj } from "@storybook/react-vite";
import { Metric } from "./metric";

const meta = {
  title: "Data Display/Metric",
  component: Metric,
  argTypes: {
    kind: {
      control: "inline-radio",
      options: ["likes", "views", "posts", "comments", "rating"],
    },
  },
  args: { kind: "likes", value: 142 },
} satisfies Meta<typeof Metric>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Likes: Story = { args: { kind: "likes", value: 142 } };
export const Views: Story = { args: { kind: "views", value: 4820 } };
export const Posts: Story = { args: { kind: "posts", value: 37 } };
export const Comments: Story = { args: { kind: "comments", value: 218 } };

/** Rating — neutral star + net value (positive). */
export const RatingPositive: Story = {
  args: { kind: "rating", value: 24 },
};

/** Rating — net negative value. */
export const RatingNegative: Story = {
  args: { kind: "rating", value: -3 },
};

/** Accent tint — e.g. a post the current user has liked. */
export const AccentLikes: Story = {
  args: { kind: "likes", value: 142, accent: true },
};

/** All five metrics side by side — a typical meta row. */
export const MetaRow: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-[12px] text-[var(--m-muted)]">
      <Metric kind="views" value={4820} />
      <Metric kind="likes" value={142} />
      <Metric kind="comments" value={18} />
      <Metric kind="rating" value={7} />
    </div>
  ),
};
