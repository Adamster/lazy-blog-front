import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toaster } from "./toaster";
import { addToastSuccess, addToastError } from "@/shared/lib/toasts";

// UPPERCASE wrapper — component has no own props; we compose it with controls.
function ToasterDemo() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[12px] tracking-[0.06em] text-[var(--m-muted)]">
        Toasts appear bottom-right and auto-dismiss after 4 s. Click a toast to
        dismiss early.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          className="mono-cta mono-focus h-9 px-4 text-[14px] font-bold tracking-[0.06em] uppercase"
          onClick={() => addToastSuccess("Post saved successfully.")}
        >
          Success
        </button>
        <button
          type="button"
          className="mono-btn-outline mono-focus h-9 px-4 text-[14px] font-semibold tracking-[0.06em] uppercase"
          onClick={() => {
            void addToastError("Something went wrong. Please try again.");
          }}
        >
          Error
        </button>
      </div>
      <Toaster />
    </div>
  );
}

const meta = {
  title: "Overlays/Toaster",
  component: ToasterDemo,
} satisfies Meta<typeof ToasterDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
