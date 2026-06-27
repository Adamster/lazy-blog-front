import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldError } from "./field-error";

const meta = {
  title: "Forms/FieldError",
  component: FieldError,
  args: { error: "This field is required" },
} satisfies Meta<typeof FieldError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InvalidEmail: Story = {
  args: { error: "Invalid email address" },
};

export const PasswordTooShort: Story = {
  args: { error: "Password must be at least 8 characters" },
};

export const LongMessage: Story = {
  args: {
    error:
      "Username must start with a letter and contain only lowercase letters, numbers, and hyphens",
  },
};
