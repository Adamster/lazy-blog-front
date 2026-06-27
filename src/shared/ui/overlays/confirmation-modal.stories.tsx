import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import ConfirmModal from "./confirmation-modal";

// UPPERCASE wrapper — rules-of-hooks forbids inline hooks in render.
function ConfirmModalStory({
  title,
  description,
  confirmLabel,
  tone,
  eyebrow,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "danger" | "default";
  eyebrow: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      {!open && (
        <button
          type="button"
          className="mono-btn-outline mono-focus h-9 px-4 text-[14px] font-semibold tracking-[0.06em] uppercase"
          onClick={() => setOpen(true)}
        >
          Reopen
        </button>
      )}
      <ConfirmModal
        isOpen={open}
        onOpenChange={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
        }}
        title={title}
        description={description || undefined}
        confirmLabel={confirmLabel}
        tone={tone}
        eyebrow={eyebrow || undefined}
      />
    </>
  );
}

const meta = {
  title: "Overlays/ConfirmationModal",
  component: ConfirmModalStory,
  argTypes: {
    tone: { control: "inline-radio", options: ["danger", "default"] },
  },
  args: {
    title: "Delete Post?",
    description: "This will permanently remove the post and all its comments.",
    confirmLabel: "Delete",
    tone: "danger",
    eyebrow: "",
  },
} satisfies Meta<typeof ConfirmModalStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DangerDelete: Story = {};

export const NeutralConfirm: Story = {
  args: {
    tone: "default",
    title: "Unpublish Post?",
    description:
      "Your post will be hidden from readers. You can republish at any time.",
    confirmLabel: "Unpublish",
    eyebrow: "",
  },
};

export const NoDescription: Story = {
  args: {
    title: "Remove Tag?",
    description: "",
    confirmLabel: "Remove",
    tone: "danger",
    eyebrow: "",
  },
};
