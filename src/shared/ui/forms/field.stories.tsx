import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "./field";

const meta = {
  title: "Forms/Field",
  component: Field,
  args: { label: "EMAIL" },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: { label: "USERNAME", required: true },
};

/** Shows the floating-label float via uncontrolled defaultValue. */
export const Filled: Story = {
  args: { label: "EMAIL", defaultValue: "user@notlazy.team" },
};

export const Password: Story = {
  args: { label: "PASSWORD", type: "password" },
};

export const PasswordFilled: Story = {
  args: {
    label: "PASSWORD",
    type: "password",
    defaultValue: "super-secret-token",
  },
};

export const WithError: Story = {
  args: { label: "EMAIL", error: "Invalid email address" },
};

export const RequiredWithError: Story = {
  args: { label: "USERNAME", required: true, error: "This field is required" },
};
