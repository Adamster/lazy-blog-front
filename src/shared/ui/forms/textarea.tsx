"use client";

import { forwardRef, useId, type ComponentPropsWithRef } from "react";
import { FieldError } from "./field-error";

type NativeTextareaProps = Omit<
  ComponentPropsWithRef<"textarea">,
  "value" | "onChange" | "id" | "className"
>;

interface TextareaProps extends NativeTextareaProps {
  label: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  id?: string;
  error?: string;
}

// Float is CSS-driven via `:placeholder-shown` (invisible `" "` placeholder).
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, value, onChange, id, error, required, rows = 2, ...rest },
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
            className="pointer-events-none absolute top-6 left-0 text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-all duration-150 group-focus-within:top-0 group-has-[textarea:not(:placeholder-shown)]:top-0"
          >
            {label}
            {required ? (
              <span className="ml-1 text-[var(--m-accent)]">*</span>
            ) : null}
          </label>

          <textarea
            id={fieldId}
            ref={ref}
            rows={rows}
            value={value}
            onChange={onChange}
            required={required}
            placeholder=" "
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={`block w-full resize-none overflow-hidden border-0 border-b-2 bg-transparent px-0 pt-5 pb-2 text-[14px] leading-[1.6] text-[var(--m-fg)] caret-[var(--m-accent)] transition-all outline-none placeholder:text-transparent ${
              hasError
                ? "border-[var(--m-error)]"
                : "border-[var(--m-dim)] focus:border-[var(--m-accent)]"
            }`}
            style={{ fontFamily: "var(--font-mono)", fieldSizing: "content" }}
            {...rest}
          />
        </div>

        {hasError ? <FieldError id={errorId} error={error!} /> : null}
      </div>
    );
  }
);
