"use client";

import { forwardRef, useId, useState, type ComponentPropsWithRef } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { FieldError } from "./field-error";

type NativeInputProps = Omit<
  ComponentPropsWithRef<"input">,
  "type" | "value" | "onChange" | "id" | "className"
>;

interface FieldProps extends NativeInputProps {
  /** Visible label — floats up when the field has content, ALWAYS uppercase. */
  label: string;
  /** Underline text input type. Password adds the eye toggle. */
  type?: "text" | "email" | "password";
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** DOM id — also wires label/error a11y. Auto-generated when omitted. */
  id?: string;
  /** Validation message; presence switches the field to its error state. */
  error?: string;
}

/**
 * Underline text field with a Material floating label. The label rests in the
 * placeholder spot when empty + blurred and floats up — always uppercase — on
 * focus OR whenever the input has content. "Has content" is detected purely in
 * CSS via `:not(:placeholder-shown)` (the input carries an invisible `" "`
 * placeholder), so it works for typed text, `value`, `defaultValue`, react-hook-
 * form's imperative `register()` values, and browser autofill alike — no JS
 * "filled" state to drift out of sync. Underline is dim by default, accent on
 * focus (error → `--m-error`). Pass react-hook-form's error message into `error`.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, type = "text", value, onChange, id, error, required, ...inputProps },
  ref
) {
  const reactId = useId();
  const fieldId = id ?? reactId;
  const errorId = `${fieldId}-error`;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const hasError = Boolean(error);

  return (
    <div>
      <div className="group relative">
        <label
          htmlFor={fieldId}
          className="pointer-events-none absolute top-5 left-0 text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-all duration-150 group-focus-within:top-0 group-has-[input:not(:placeholder-shown)]:top-0"
        >
          {label}
          {required ? (
            <span className="ml-1 text-[var(--m-accent)]">*</span>
          ) : null}
        </label>

        <input
          id={fieldId}
          ref={ref}
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          required={required}
          // Invisible placeholder so `:placeholder-shown` reflects emptiness —
          // this is what drives the float, independent of value source.
          placeholder=" "
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={`block w-full border-0 border-b-2 bg-transparent px-0 pt-5 pb-2 text-[14px] leading-[1.6] text-[var(--m-fg)] caret-[var(--m-accent)] transition-all outline-none placeholder:text-transparent ${
            isPassword ? "pr-8" : ""
          } ${
            hasError
              ? "border-[var(--m-error)]"
              : "border-[var(--m-dim)] focus:border-[var(--m-accent)]"
          }`}
          style={{ fontFamily: "var(--font-mono)" }}
          {...inputProps}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            tabIndex={-1}
            className="mono-focus absolute right-0 bottom-2 flex p-1 text-[var(--m-muted2)] transition-colors hover:text-[var(--m-accent)]"
          >
            {showPassword ? (
              <EyeSlashIcon className="size-[17px]" aria-hidden="true" />
            ) : (
              <EyeIcon className="size-[17px]" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      {hasError ? <FieldError id={errorId} error={error!} /> : null}
    </div>
  );
});
