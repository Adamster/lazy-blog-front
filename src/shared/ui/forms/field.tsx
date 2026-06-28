"use client";

import { forwardRef, useId, useState, type ComponentPropsWithRef } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { FieldError } from "./field-error";

type NativeInputProps = Omit<
  ComponentPropsWithRef<"input">,
  "type" | "value" | "onChange" | "id" | "className"
>;

interface FieldProps extends NativeInputProps {
  label: string;
  type?: "text" | "email" | "password";
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  id?: string;
  error?: string;
}

// Float is CSS-driven via `:placeholder-shown` (invisible `" "` placeholder), so
// no JS "filled" state can drift from value/defaultValue/register/autofill.
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
          className="pointer-events-none absolute top-6 left-0 text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-all duration-150 group-focus-within:top-0 group-has-[input:not(:placeholder-shown)]:top-0"
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
          // Invisible placeholder so `:placeholder-shown` drives the float.
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
              <EyeSlashIcon className="size-3.5" aria-hidden="true" />
            ) : (
              <EyeIcon className="size-3.5" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      {hasError ? <FieldError id={errorId} error={error!} /> : null}
    </div>
  );
});
