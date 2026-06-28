"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { useClickOutside } from "react-haiku";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { FieldError } from "./field-error";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectBaseProps {
  label: string;
  options: SelectOption[];
  id?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

interface SingleSelectProps extends SelectBaseProps {
  multiple?: false;
  value: string | undefined;
  onChange: (value: string) => void;
}

interface MultiSelectProps extends SelectBaseProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

type SelectProps = SingleSelectProps | MultiSelectProps;

// Custom listbox button + popover: native `<select>` can't hit the brutalist
// popup look across browsers.
export function Select(props: SelectProps) {
  const {
    label,
    options,
    id,
    error,
    required,
    placeholder = "Select…",
    disabled,
    multiple,
  } = props;

  const reactId = useId();
  const fieldId = id ?? reactId;
  const labelId = `${fieldId}-label`;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(error);

  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedValues = useMemo<string[]>(
    () => (multiple ? props.value : props.value ? [props.value] : []),
    [multiple, props.value]
  );

  const selectedLabels = useMemo(
    () =>
      options
        .filter((o) => selectedValues.includes(o.value))
        .map((o) => o.label),
    [options, selectedValues]
  );

  useClickOutside(containerRef, () => setOpen(false));

  const commit = useCallback(
    (value: string) => {
      if (multiple) {
        const next = selectedValues.includes(value)
          ? selectedValues.filter((v) => v !== value)
          : [...selectedValues, value];
        props.onChange(next);
      } else {
        props.onChange(value);
        setOpen(false);
      }
    },
    [multiple, props, selectedValues]
  );

  const openListbox = useCallback(() => {
    const firstSelected = options.findIndex((o) =>
      selectedValues.includes(o.value)
    );
    setActiveIndex(firstSelected >= 0 ? firstSelected : 0);
    setOpen(true);
  }, [options, selectedValues]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (
      !open &&
      (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      openListbox();
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const option = options[activeIndex];
        if (option) commit(option.value);
        break;
      }
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const display = selectedLabels.length > 0 ? selectedLabels.join(", ") : null;

  return (
    <div ref={containerRef} className="relative">
      <span id={labelId} className="mono-field-label">
        {label}
        {required ? (
          <span className="ml-1 text-[var(--m-accent)]">*</span>
        ) : null}
      </span>

      <button
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${fieldId}`}
        aria-describedby={hasError ? errorId : undefined}
        onClick={() => {
          if (disabled) return;
          if (open) setOpen(false);
          else openListbox();
        }}
        onKeyDown={onTriggerKeyDown}
        className={`flex w-full items-center justify-between gap-2 border-0 border-b-2 bg-transparent px-0 pt-1 pb-2 text-left text-[14px] leading-[1.6] transition-colors outline-none disabled:opacity-60 ${
          hasError
            ? "border-[var(--m-error)]"
            : "border-[var(--m-dim)] focus-visible:border-[var(--m-accent)]"
        } mono-focus`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span
          className={`truncate ${display ? "text-[var(--m-fg)]" : "text-[var(--m-muted2)]"}`}
        >
          {display ?? placeholder}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-3.5 shrink-0 text-[var(--m-muted2)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          // Focus on mount so keyboard nav works immediately.
          ref={(node) => node?.focus()}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-multiselectable={multiple || undefined}
          aria-activedescendant={
            options[activeIndex]
              ? `${fieldId}-opt-${options[activeIndex].value}`
              : undefined
          }
          onKeyDown={onListKeyDown}
          className="mono-scrollbar absolute z-[var(--m-z-dropdown)] mt-1 max-h-60 w-full overflow-auto border-2 border-[var(--m-dim)] bg-[var(--m-card)] py-1 shadow-none outline-none"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase">
              No options
            </li>
          ) : (
            options.map((option, index) => {
              const isSelected = selectedValues.includes(option.value);
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  id={`${fieldId}-opt-${option.value}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(option.value)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[11px] leading-none font-medium tracking-[0.12em] uppercase transition-colors ${
                    isActive
                      ? "bg-[var(--m-panel)] text-[var(--m-fg)]"
                      : "text-[var(--m-muted)]"
                  } ${isSelected ? "text-[var(--m-fg)]" : ""}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected ? (
                    <span aria-hidden="true" className="text-[var(--m-accent)]">
                      ✓
                    </span>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {hasError ? <FieldError id={errorId} error={error!} /> : null}
    </div>
  );
}
