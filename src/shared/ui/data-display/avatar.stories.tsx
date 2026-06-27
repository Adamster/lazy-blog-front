import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./avatar";

const meta = {
  title: "Data Display/Avatar",
  component: Avatar,
  args: {
    name: "Igor Mariuta",
    size: "sm",
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Small (40px) byline/comment size — letter fallback, no src. */
export const SmallLetterFallback: Story = {};

/** Large (128px) profile-header size — letter fallback, no src. */
export const LargeLetterFallback: Story = {
  args: { size: "lg" },
};

/** Small avatar with a real image src. */
export const SmallWithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/40",
    name: "Alex Dev",
    size: "sm",
  },
};

/** Large avatar with a real image src. */
export const LargeWithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/128",
    name: "Alex Dev",
    size: "lg",
  },
};

/** Falls back to the initial when the src URL is broken. */
export const BrokenSrc: Story = {
  args: {
    src: "https://example.invalid/broken.jpg",
    name: "Broken Image",
    size: "sm",
  },
};

/** Single-character name still renders correctly. */
export const SingleChar: Story = {
  args: { name: "Z", size: "sm" },
};

/** Row of multiple small avatars — byline / comment-list context. */
export const AvatarRow: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Igor Mariuta" size="sm" />
      <Avatar name="Alex Dev" src="https://i.pravatar.cc/40?img=3" size="sm" />
      <Avatar name="Sam Lazypants" size="sm" />
    </div>
  ),
};
