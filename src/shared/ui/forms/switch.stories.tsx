import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";

function InteractiveSwitch() {
  const [checked, setChecked] = useState(false);
  return <Switch checked={checked} onChange={setChecked} label="PUBLISHED" />;
}

const meta = {
  title: "Forms/Switch",
  component: Switch,
  args: {
    label: "PUBLISHED",
    checked: false,
    onChange: () => {},
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = {
  args: { checked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledOn: Story = {
  args: { checked: true, disabled: true },
};

export const Interactive: Story = {
  render: () => <InteractiveSwitch />,
};
