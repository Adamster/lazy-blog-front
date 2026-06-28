"use client";

import { useRef, useState, type ReactNode } from "react";
import { useClickOutside } from "react-haiku";
import { EllipsisHorizontalCircleIcon } from "@heroicons/react/24/outline";

export interface MenuItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

interface MenuProps {
  items: MenuItem[];
  triggerLabel: string;
}

export function Menu({ items, triggerLabel }: MenuProps) {
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
        className="mono-focus flex size-9 items-center justify-center text-[var(--m-muted2)] transition-colors hover:text-[var(--m-accent)]"
      >
        <EllipsisHorizontalCircleIcon className="size-4" />
      </button>

      {/* Icon buttons to the LEFT of the dots, centered to the trigger via inset-y-0. */}
      {open && (
        <div
          role="menu"
          className="absolute inset-y-0 right-full z-[var(--m-z-dropdown)] mr-1 flex items-center gap-3"
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
                  "mono-icon-btn size-8 [&>svg]:size-4 " +
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
