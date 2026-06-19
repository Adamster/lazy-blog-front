"use client";

import { useRef, useState, type ReactNode } from "react";
import { useClickOutside } from "react-haiku";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";

export interface MonoMenuItem {
  /** Stable id for the row (React key + onSelect dispatch). */
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
  /** Render the row in the error color (destructive actions). */
  danger?: boolean;
}

interface MonoMenuProps {
  items: MonoMenuItem[];
  /** Accessible label for the trigger (e.g. "Post options"). */
  triggerLabel: string;
}

/**
 * Brutalist 3-dot kebab — opens a minimal icon-only action row to the LEFT of
 * the dots. Shared by the post header and own-comment rows so the two kebabs
 * can never drift apart.
 */
export function MonoMenu({ items, triggerLabel }: MonoMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center bg-transparent text-[var(--m-muted2)] transition-colors hover:text-[var(--m-accent)]"
      >
        <EllipsisVerticalIcon className="size-[18px]" />
      </button>

      {/* Minimal popout: bordered icon buttons (like the emoji button) in a
          row, to the LEFT of the dots. */}
      {open && (
        <div
          role="menu"
          className="absolute top-0 right-full z-30 mr-2 flex items-center gap-2"
        >
          {items.map((item) => {
            const label = typeof item.label === "string" ? item.label : item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                aria-label={label}
                title={label}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={
                  "mono-icon-btn size-9 bg-[var(--m-card)] [&>svg]:size-[18px] " +
                  (item.danger
                    ? "text-[var(--m-error)] hover:border-[var(--m-error)] hover:text-[var(--m-error)]"
                    : "")
                }
              >
                {item.icon}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
