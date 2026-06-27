"use client";

import { CheckIcon } from "@heroicons/react/24/solid";

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Required-field asterisk + native `required` attribute. */
  required?: boolean;
  /** Error message (11px / 0.12em, `--m-error`) — also reddens the box border. */
  error?: string;
}

/**
 * Brutalist-Mono checkbox — a native `input[type=checkbox]` (kept `sr-only` for
 * a11y; the visible box is its `peer`) + an 18px 2px-bordered SQUARE (no
 * circles here). Checked = accent fill with a `✓`; focus-visible draws the
 * accent ring on the box. 14px UI-body label; `required` renders the canonical
 * asterisk; `error` reddens the border and shows an 11px / 0.12em message.
 */
export function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  required = false,
  error,
}: CheckboxProps) {
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
      {error ? (
        <p className="mt-2 text-[11px] tracking-[0.12em] text-[var(--m-error)] uppercase">
          {error}
        </p>
      ) : null}
    </div>
  );
}
