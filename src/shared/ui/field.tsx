"use client";

import { forwardRef, useId, useState, type ComponentPropsWithRef } from "react";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

/** Eye / eye-off toggle glyph for password fields. */
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M3 3l18 18" strokeLinecap="round" /> : null}
    </svg>
  );
}

type NativeInputProps = Omit<
  ComponentPropsWithRef<"input">,
  "type" | "value" | "onChange" | "id" | "className"
>;

interface FieldProps extends NativeInputProps {
  /** Visible label — floats up on focus/fill, ALWAYS rendered uppercase. */
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
 * Underline text field with a Material floating label (the design system's
 * auth/reset field). The label sits as a placeholder when empty + blurred and
 * floats up — always uppercase — on focus or when filled. Underline is dim by
 * default and turns accent on focus (error → `--m-error`). Password fields get
 * the eye toggle. Pass react-hook-form's error message into `error`.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  {
    label,
    type = "text",
    value,
    onChange,
    id,
    error,
    required,
    onFocus,
    onBlur,
    ...inputProps
  },
  ref
) {
  const reactId = useId();
  const fieldId = id ?? reactId;
  const errorId = `${fieldId}-error`;

  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [filled, setFilled] = useState(false);

  const isPassword = type === "password";
  const hasError = Boolean(error);
  // Controlled (RHF passes value) and uncontrolled both float correctly: the
  // value-derived check covers controlled; `filled` (set onChange) covers the
  // uncontrolled `register()` path where `value` is undefined.
  const floated =
    focused || filled || (value !== undefined && value.length > 0);

  return (
    <div>
      <div className="relative">
        <label
          htmlFor={fieldId}
          className={`pointer-events-none absolute left-0 text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-all duration-150 ${
            floated ? "top-0" : "top-5"
          }`}
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
          required={required}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          onChange={(e) => {
            setFilled(e.target.value.length > 0);
            onChange?.(e);
          }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            setFilled(e.target.value.length > 0);
            onBlur?.(e);
          }}
          className={`block w-full border-0 border-b-2 bg-transparent px-0 pt-5 pb-2 text-[14px] leading-[1.5] text-[var(--m-fg)] caret-[var(--m-accent)] transition-all outline-none ${
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
            className={`absolute right-0 bottom-2 flex p-1 text-[var(--m-muted2)] transition-colors hover:text-[var(--m-accent)] ${focusRing}`}
          >
            <EyeIcon off={showPassword} />
          </button>
        ) : null}
      </div>

      {hasError ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-[11px] tracking-[0.02em] text-[var(--m-error)]"
        >
          {`! ${error}`}
        </p>
      ) : null}
    </div>
  );
});
