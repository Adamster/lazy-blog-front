"use client";

import type { ReactNode } from "react";
import { Spinner } from "@/shared/ui";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface ProfileFormSectionProps {
  /** Submit handler (the form's `onSubmit`). */
  onSubmit: () => void;
  /** Bottom-right primary action label (uppercase, NO arrow — actions, not nav). */
  actionLabel: string;
  /** Pending label shown beside the spinner while the mutation runs. */
  pendingLabel: string;
  pending: boolean;
  children: ReactNode;
}

/**
 * Shared chrome for both edit-profile tab forms: the fields → the bottom-right
 * primary action (24px above = form → primary action). The stepper names the
 * section, so there's no eyebrow; the action is the auto-width 36px `.mono-cta`
 * (uppercase, no arrow — per the arrow rule actions never carry a `→`), with a
 * pending spinner. Keeping the action rhythm here means the Profile and Security
 * panels can't drift apart.
 */
export function ProfileFormSection({
  onSubmit,
  actionLabel,
  pendingLabel,
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
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className={`mono-cta font-display inline-flex h-9 items-center justify-center gap-2 px-4 text-[14px] leading-none font-bold tracking-[0.06em] ${focusRing}`}
        >
          {pending ? (
            <>
              <Spinner className="text-[14px]" />
              {pendingLabel}
            </>
          ) : (
            actionLabel
          )}
        </button>
      </div>
    </form>
  );
}
