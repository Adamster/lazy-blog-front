import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./select";
import type { SelectOption } from "./select";

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "tech", label: "TECH" },
  { value: "design", label: "DESIGN" },
  { value: "culture", label: "CULTURE" },
  { value: "opinion", label: "OPINION" },
];

function InteractiveSelect() {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <Select
      label="CATEGORY"
      options={CATEGORY_OPTIONS}
      value={value}
      onChange={setValue}
      placeholder="Pick a category…"
    />
  );
}

function RequiredSelect() {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <Select
      label="CATEGORY"
      options={CATEGORY_OPTIONS}
      value={value}
      onChange={setValue}
      required
    />
  );
}

function MultipleSelect() {
  const [values, setValues] = useState<string[]>([]);
  return (
    <Select
      multiple
      label="TAGS"
      options={CATEGORY_OPTIONS}
      value={values}
      onChange={setValues}
      placeholder="Pick one or more…"
    />
  );
}

const meta = {
  title: "Forms/Select",
  component: Select,
  // Satisfies required props so render-only stories don't need args.
  args: {
    label: "CATEGORY",
    options: CATEGORY_OPTIONS,
    value: undefined as string | undefined,
    onChange: () => {},
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <InteractiveSelect />,
};

/** Static — shows a pre-selected value without needing to open the listbox. */
export const WithSelection: Story = {
  render: () => (
    <Select
      label="CATEGORY"
      options={CATEGORY_OPTIONS}
      value="design"
      onChange={() => {}}
    />
  ),
};

export const Required: Story = {
  render: () => <RequiredSelect />,
};

export const MultipleMode: Story = {
  render: () => <MultipleSelect />,
};

export const WithError: Story = {
  render: () => (
    <Select
      label="CATEGORY"
      options={CATEGORY_OPTIONS}
      value={undefined}
      onChange={() => {}}
      error="Please select a category"
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select
      label="CATEGORY"
      options={CATEGORY_OPTIONS}
      value="tech"
      onChange={() => {}}
      disabled
    />
  ),
};

export const EmptyOptions: Story = {
  render: () => (
    <Select
      label="TAGS"
      options={[]}
      value={undefined}
      onChange={() => {}}
      placeholder="No tags available"
    />
  ),
};
