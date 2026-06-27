import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatBar } from "./stat-bar";

const meta = {
  title: "Data Display/StatBar",
  component: StatBar,
  args: { label: "CPU", value: 42 },
} satisfies Meta<typeof StatBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mid-range value — accent fill. */
export const MidRange: Story = {};

/** High value — nearly full track. */
export const High: Story = { args: { label: "RAM", value: 87 } };

/** Full 100%. */
export const Full: Story = { args: { label: "DISK", value: 100 } };

/** Zero — empty track. */
export const Zero: Story = { args: { label: "NET", value: 0 } };

/** Below the default low threshold (10) — fill turns error red. */
export const Critical: Story = { args: { label: "HEALTH", value: 7 } };

/** Custom low threshold — critical at &lt; 30. */
export const CustomThreshold: Story = {
  args: { label: "KARMA", value: 18, lowThreshold: 30 },
};

/** Fewer cells — a compact 12-cell track. */
export const FewCells: Story = {
  args: { label: "SIGNAL", value: 66, cells: 12 },
};

/** A stack of system-stats rows — typical usage in a terminal panel. */
export const SystemStats: Story = {
  render: () => (
    <div className="flex flex-col gap-3 font-mono">
      <StatBar label="CPU" value={64} />
      <StatBar label="RAM" value={82} />
      <StatBar label="DISK" value={91} />
      <StatBar label="NETWORK" value={8} />
      <StatBar label="KARMA" value={55} />
    </div>
  ),
};
