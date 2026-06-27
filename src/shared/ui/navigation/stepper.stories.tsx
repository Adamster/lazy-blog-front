import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AdjustmentsHorizontalIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { Stepper } from "./stepper";

const STEPS = ["Setup", "Write"];
const ICONS = [AdjustmentsHorizontalIcon, PencilIcon];

function InteractiveStepper() {
  const [current, setCurrent] = useState(1);
  const completeSteps = current > 1 ? [1] : [];
  return (
    <Stepper
      steps={STEPS}
      icons={ICONS}
      current={current}
      onSelect={setCurrent}
      completeSteps={completeSteps}
    />
  );
}

const meta = {
  title: "Navigation/Stepper",
  component: Stepper,
  args: {
    steps: STEPS,
    icons: ICONS,
    current: 1,
    onSelect: () => {},
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Step 1 active — neither step has been completed yet. */
export const Step1Active: Story = {};

/** Step 2 active — Step 1 is complete (accent connector + outline box). */
export const Step2Active: Story = {
  args: { current: 2, completeSteps: [1] },
};

/** Both steps complete — accent outlines on both boxes, accent connector. */
export const BothComplete: Story = {
  args: { current: 2, completeSteps: [1, 2] },
};

/** Step 1 has a validation error — red border and icon. */
export const Step1Error: Story = {
  args: { current: 1, errorSteps: [1] },
};

/** Step 2 active, Step 1 errored — red connector leading out of Step 1. */
export const Step2ActiveStep1Error: Story = {
  args: { current: 2, errorSteps: [1] },
};

/** Clicking a box jumps to that step; passing Step 1 turns its connector accent. */
export const Interactive: Story = {
  render: () => <InteractiveStepper />,
};
