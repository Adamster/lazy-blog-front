"use client";

import { CheckIcon } from "@heroicons/react/24/solid";
import { FieldError } from "./field-error";

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

// Native input kept `sr-only` (a11y); the visible square box is its `peer`.
export function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  required = false,
  error,
}: CheckboxProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label
        htmlFor={id}
        className={`flex items-center gap-3 ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          aria-hidden="true"
          className={`flex size-[18px] flex-none items-center justify-center border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--m-accent)] ${
            checked
              ? "border-[var(--m-accent)] bg-[var(--m-accent)] text-[var(--m-bg)]"
              : `bg-transparent ${error ? "border-[var(--m-error)]" : "border-[var(--m-dim)]"}`
          }`}
        >
          {checked ? <CheckIcon className="size-3.5" /> : null}
        </span>
        <span className="text-[14px] leading-none text-[var(--m-fg)]">
          {label}
          {required ? (
            <span className="ml-1 text-[var(--m-accent)]">*</span>
          ) : null}
        </span>
      </label>
      {error ? <FieldError id={errorId} error={error} /> : null}
    </div>
  );
}
