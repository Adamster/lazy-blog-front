import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "./radio";
import type { RadioOption } from "./radio";

const VISIBILITY_OPTIONS: RadioOption[] = [
  { value: "published", label: "PUBLISHED" },
  { value: "draft", label: "DRAFT" },
  { value: "private", label: "PRIVATE" },
];

function InteractiveRadioGroup() {
  const [value, setValue] = useState("draft");
  return (
    <RadioGroup
      name="visibility-interactive"
      label="VISIBILITY"
      options={VISIBILITY_OPTIONS}
      value={value}
      onChange={setValue}
    />
  );
}

const meta = {
  title: "Forms/RadioGroup",
  component: RadioGroup,
  args: {
    name: "visibility",
    value: "",
    onChange: () => {},
    options: VISIBILITY_OPTIONS,
    label: "VISIBILITY",
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No option pre-selected. */
export const Default: Story = {};

export const WithSelection: Story = {
  args: { value: "draft" },
};

export const Required: Story = {
  args: { required: true },
};

export const Disabled: Story = {
  args: { value: "published", disabled: true },
};

export const NoLabel: Story = {
  args: { label: undefined },
};

export const Interactive: Story = {
  render: () => <InteractiveRadioGroup />,
};
