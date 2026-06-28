"use client";

import type { ReactNode } from "react";
import { IconSubmitButton } from "@/shared/ui";

interface ProfileFormSectionProps {
  onSubmit: () => void;
  actionLabel: string;
  pending: boolean;
  children: ReactNode;
}

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
