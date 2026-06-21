"use client";

import { useRef, useState } from "react";
import { useClickOutside } from "react-haiku";
import type { SelectOption } from "@/shared/ui";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface PostTagPickerProps {
  options: SelectOption[];
  /** Selected tag ids (API accepts multiple tags). */
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * Bracket-style multi-tag picker for Step 1. The collapsed trigger carries the
 * `[ … ]` brackets as the selected-tag preview — `[ SELECT TAG ]` (muted) when
 * empty, `[ a, b ]` (accent) once chosen. The open list renders plain labels
 * (no brackets) sized to fit the tags (no inner scrollbar). Backed by a real
 * `aria-multiselectable` listbox with full keyboard support (↑/↓ move,
 * Enter/Space toggle, Esc close).
 */
export function PostTagPicker({
  options,
  value,
  onChange,
}: PostTagPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useClickOutside(containerRef, () => setOpen(false));

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  const triggerLabel =
    selectedLabels.length > 0 ? selectedLabels.join(", ") : "SELECT TAG";

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
    );
  };

  const openList = () => {
    const firstSelected = options.findIndex((o) => value.includes(o.value));
    setActiveIndex(firstSelected >= 0 ? firstSelected : 0);
    setOpen(true);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (
      !open &&
      (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      openList();
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
        if (option) toggle(option.value);
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
        className={`inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase ${
          selectedLabels.length > 0
            ? "text-[var(--m-accent)]"
            : "text-[var(--m-muted2)]"
        } ${focusRing}`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span>{`[ ${triggerLabel} ]`}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`text-[var(--m-muted2)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul
          ref={(node) => {
            listRef.current = node;
            node?.focus();
          }}
          role="listbox"
          tabIndex={-1}
          aria-multiselectable
          aria-label="Tags"
          aria-activedescendant={
            options[activeIndex]
              ? `tag-opt-${options[activeIndex].value}`
              : undefined
          }
          onKeyDown={onListKeyDown}
          className="mono-scrollbar absolute top-7 left-0 z-30 mt-1 max-h-60 min-w-[240px] overflow-auto border-2 border-[var(--m-dim)] bg-[var(--m-card)] py-1 outline-none"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase">
              No tags
            </li>
          ) : (
            options.map((option, index) => {
              const isSelected = value.includes(option.value);
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  id={`tag-opt-${option.value}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => toggle(option.value)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[11px] font-medium tracking-[0.12em] uppercase transition-colors ${
                    isActive
                      ? "bg-[var(--m-panel)] text-[var(--m-fg)]"
                      : "text-[var(--m-muted)]"
                  } ${isSelected ? "text-[var(--m-fg)]" : ""}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span>{option.label}</span>
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
    </div>
  );
}
