import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Modal, ModalHeader, SubmitButton } from "./modal";

// UPPERCASE wrapper — rules-of-hooks forbids inline hooks in render.
function ModalStory({
  eyebrow,
  title,
  subtitle,
  width,
  tone,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  width: "sm" | "md" | "lg" | "wide" | "xl";
  tone: "default" | "danger";
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
      <Modal
        isOpen={open}
        onOpenChange={() => setOpen(false)}
        width={width}
        tone={tone}
      >
        {(close) => (
          <>
            <ModalHeader
              eyebrow={eyebrow}
              title={title}
              subtitle={subtitle || undefined}
              onClose={close}
            />
            <SubmitButton>Submit</SubmitButton>
          </>
        )}
      </Modal>
    </>
  );
}

const meta = {
  title: "Overlays/Modal",
  component: ModalStory,
  argTypes: {
    width: {
      control: "inline-radio",
      options: ["sm", "md", "lg", "wide", "xl"],
    },
    tone: { control: "inline-radio", options: ["default", "danger"] },
  },
  args: {
    eyebrow: "// AUTH",
    title: "Sign In",
    subtitle: "Welcome back to the terminal.",
    width: "md",
    tone: "default",
  },
} satisfies Meta<typeof ModalStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Danger: Story = {
  args: {
    tone: "danger",
    eyebrow: "// DANGER",
    title: "Delete Post?",
    subtitle: "This action cannot be undone.",
  },
};

export const Wide: Story = {
  args: {
    width: "wide",
    eyebrow: "// REGISTER",
    title: "Create Account",
    subtitle: "Join the not-lazy crowd.",
  },
};

export const ExtraLarge: Story = {
  args: {
    width: "xl",
    eyebrow: "// EDITOR",
    title: "Cover Image",
    subtitle: "",
  },
};
