"use client";

import { forwardRef, useId, type ComponentPropsWithRef } from "react";

type NativeTextareaProps = Omit<
  ComponentPropsWithRef<"textarea">,
  "value" | "onChange" | "id" | "className"
>;

interface TextareaProps extends NativeTextareaProps {
  /** Visible label — floats up when the field has content, ALWAYS uppercase. */
  label: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  /** DOM id — also wires label/error a11y. Auto-generated when omitted. */
  id?: string;
  /** Validation message; presence switches the field to its error state. */
  error?: string;
  /** Start as a single row and auto-grow with content (like the comment
   *  composer) instead of a fixed `rows` box. */
  autoGrow?: boolean;
}

/**
 * Multiline sibling of {@link Field} — same underline + Material floating label,
 * for longer prose (e.g. a profile biography). The float is driven purely by CSS
 * `:not(:placeholder-shown)` (invisible `" "` placeholder), so it tracks any
 * value source — typed, `value`, `defaultValue`, react-hook-form, autofill.
 * Underline turns accent on focus (error → `--m-error`).
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      value,
      onChange,
      id,
      error,
      required,
      rows = 3,
      autoGrow = false,
      ...rest
    },
    ref
  ) {
    const reactId = useId();
    const fieldId = id ?? reactId;
    const errorId = `${fieldId}-error`;

    const hasError = Boolean(error);

    return (
      <div>
        <div className="group relative">
          <label
            htmlFor={fieldId}
            className="pointer-events-none absolute top-5 left-0 text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-all duration-150 group-focus-within:top-0 group-has-[textarea:not(:placeholder-shown)]:top-0"
          >
            {label}
            {required ? (
              <span className="ml-1 text-[var(--m-accent)]">*</span>
            ) : null}
          </label>

          <textarea
            id={fieldId}
            ref={ref}
            rows={autoGrow ? 1 : rows}
            value={value}
            onChange={onChange}
            required={required}
            placeholder=" "
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={`block w-full border-0 border-b-2 bg-transparent px-0 pt-5 pb-2 text-[14px] leading-[1.6] text-[var(--m-fg)] caret-[var(--m-accent)] transition-all outline-none placeholder:text-transparent ${
              autoGrow ? "resize-none overflow-hidden" : "resize-y"
            } ${
              hasError
                ? "border-[var(--m-error)]"
                : "border-[var(--m-dim)] focus:border-[var(--m-accent)]"
            }`}
            style={{
              fontFamily: "var(--font-mono)",
              ...(autoGrow ? { fieldSizing: "content" } : {}),
            }}
            {...rest}
          />
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
  }
);
