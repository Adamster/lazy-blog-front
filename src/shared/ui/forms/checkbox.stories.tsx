import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";

function InteractiveCheckbox() {
  const [checked, setChecked] = useState(false);
  return (
    <Checkbox
      id="cb-interactive"
      label="ACCEPT TERMS OF SERVICE"
      checked={checked}
      onChange={setChecked}
    />
  );
}

const meta = {
  title: "Forms/Checkbox",
  component: Checkbox,
  args: {
    id: "cb-story",
    label: "SUBSCRIBE TO UPDATES",
    checked: false,
    onChange: () => {},
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { checked: true },
};

export const Required: Story = {
  args: { label: "ACCEPT TERMS OF SERVICE", required: true },
};

export const RequiredChecked: Story = {
  args: { label: "ACCEPT TERMS OF SERVICE", required: true, checked: true },
};

export const WithError: Story = {
  args: {
    label: "ACCEPT TERMS OF SERVICE",
    required: true,
    error: "You must accept the terms of service",
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { checked: true, disabled: true },
};

export const Interactive: Story = {
  render: () => <InteractiveCheckbox />,
};
