import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkline } from "./sparkline";

const SERIES_GROWING = [
  { label: "Jan", count: 1 },
  { label: "Feb", count: 2 },
  { label: "Mar", count: 4 },
  { label: "Apr", count: 3 },
  { label: "May", count: 6 },
  { label: "Jun", count: 9 },
];

const SERIES_FLAT = [
  { label: "Jan", count: 3 },
  { label: "Feb", count: 3 },
  { label: "Mar", count: 3 },
  { label: "Apr", count: 3 },
  { label: "May", count: 3 },
  { label: "Jun", count: 3 },
];

const SERIES_WITH_GAPS = [
  { label: "Jan", count: 5 },
  { label: "Feb", count: 0 },
  { label: "Mar", count: 0 },
  { label: "Apr", count: 2 },
  { label: "May", count: 0 },
  { label: "Jun", count: 4 },
];

const SERIES_SINGLE_SPIKE = [
  { label: "Jan", count: 0 },
  { label: "Feb", count: 0 },
  { label: "Mar", count: 12 },
  { label: "Apr", count: 1 },
  { label: "May", count: 0 },
  { label: "Jun", count: 0 },
];

const meta = {
  title: "Data Display/Sparkline",
  component: Sparkline,
  args: {
    series: SERIES_GROWING,
    gradientId: "sparkline-default",
    ariaLabel: "Posts per month",
  },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Upward trend — typical growing author activity. */
export const Growing: Story = {};

/** Flat line — no variation in monthly counts. */
export const Flat: Story = {
  args: { series: SERIES_FLAT, gradientId: "sparkline-flat" },
};

/** Months with zero activity — curve dips to the baseline. */
export const WithGaps: Story = {
  args: { series: SERIES_WITH_GAPS, gradientId: "sparkline-gaps" },
};

/** Single spike — the curve peaks sharply then drops off. */
export const SingleSpike: Story = {
  args: { series: SERIES_SINGLE_SPIKE, gradientId: "sparkline-spike" },
};

/** Month labels hidden — e.g. in a compact stats cell. */
export const NoLabels: Story = {
  args: { showLabels: false, gradientId: "sparkline-nolabels" },
};

/** In a constrained container — 200px wide, as in a profile stat card. */
export const Constrained: Story = {
  render: () => (
    <div style={{ width: 200 }}>
      <Sparkline
        series={SERIES_GROWING}
        gradientId="sparkline-constrained"
        ariaLabel="Posts per month"
      />
    </div>
  ),
};
