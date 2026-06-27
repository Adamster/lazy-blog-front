import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MatrixRain, MatrixRainOverlay } from "./matrix-rain";

const meta = {
  title: "Effects/MatrixRain",
  component: MatrixRain,
  decorators: [
    (Story) => (
      <div
        style={{ width: 320, height: 200, border: "2px solid var(--m-dim)" }}
      >
        <Story />
      </div>
    ),
  ],
  args: {},
} satisfies Meta<typeof MatrixRain>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SlowFade: Story = {
  args: { fade: 0.04 },
};

export const Paused: Story = {
  args: { active: false },
};

// ─── MatrixRainOverlay (needs interactive state) ────────────────────────────

function OverlayDemo() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ padding: 16 }}>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "8px 16px",
          border: "2px solid var(--m-line)",
          background: "transparent",
          color: "var(--m-fg)",
          cursor: "pointer",
        }}
      >
        Open Matrix Overlay
      </button>
      <MatrixRainOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

export const Overlay: StoryObj = {
  render: () => <OverlayDemo />,
};
