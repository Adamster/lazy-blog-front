"use client";

import type { ReactNode } from "react";
import { IconSubmitButton } from "@/shared/ui";

interface ProfileFormSectionProps {
  /** Submit handler (the form's `onSubmit`). */
  onSubmit: () => void;
  /** Primary action's accessible name + tooltip (e.g. "Save changes"). */
  actionLabel: string;
  pending: boolean;
  children: ReactNode;
}

/**
 * Shared chrome for both edit-profile tab forms: the fields → the bottom-right
 * primary action (24px above = form → primary action). The stepper names the
 * section, so there's no eyebrow; the action is the icon-only 36px rocket
 * `IconSubmitButton` (the app-wide submit/save primary), right-aligned, with a
 * pending spinner. `actionLabel` carries the action ("Save changes" /
 * "Update password") as the rocket's aria-label + tooltip. Keeping the action
 * here means the Profile and Security panels can't drift apart.
 */
export function ProfileFormSection({
  onSubmit,
  actionLabel,
  pending,
  children,
}: ProfileFormSectionProps) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}

      <div className="mt-6 flex justify-end">
        <IconSubmitButton label={actionLabel} pending={pending} />
      </div>
    </form>
  );
}
