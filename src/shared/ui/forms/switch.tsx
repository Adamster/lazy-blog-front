"use client";

import { useId } from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}

export function Switch({
  checked,
  onChange,
  label,
  id,
  disabled,
}: SwitchProps) {
  const reactId = useId();
  const switchId = id ?? reactId;

  return (
    <button
      type="button"
      id={switchId}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`group mono-focus flex w-full items-center gap-3 disabled:opacity-60`}
    >
      <span
        aria-hidden="true"
        className={`relative flex h-6 w-11 shrink-0 items-center border-2 transition-colors ${
          checked
            ? "border-[var(--m-accent)] bg-[var(--m-accent)]"
            : "border-[var(--m-dim)] bg-transparent"
        }`}
      >
        <span
          className={`absolute size-4 transition-[left] duration-150 ${
            checked
              ? "left-[calc(100%-1rem-2px)] bg-[var(--m-bg)]"
              : "left-[2px] bg-[var(--m-muted2)]"
          }`}
        />
      </span>
      <span className="text-[11px] leading-none tracking-[0.12em] text-[var(--m-fg)] uppercase">
        {label}
      </span>
    </button>
  );
}
