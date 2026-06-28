"use client";

import type { ComponentType } from "react";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { Spinner } from "../feedback/loading";

export function IconSubmitButton({
  label,
  icon: Icon = RocketLaunchIcon,
  pending = false,
  disabled = false,
  className = "",
}: {
  // Drives both aria-label and title — the icon has no visible text.
  label: string;
  icon?: ComponentType<{ className?: string }>;
  pending?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-label={label}
      aria-busy={pending}
      title={label}
      className={`mono-cta mono-focus inline-flex size-9 shrink-0 items-center justify-center ${className}`}
    >
      {pending ? (
        <Spinner className="text-[14px]" />
      ) : (
        <Icon className="size-3.5" />
      )}
    </button>
  );
}
