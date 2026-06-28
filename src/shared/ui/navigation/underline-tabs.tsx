"use client";

import { useRef } from "react";

export interface UnderlineTabItem {
  id: string;
  label: string;
}

interface UnderlineTabsProps {
  tabs: readonly UnderlineTabItem[];
  current: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
  panelIdPrefix?: string;
  /** Set `false` under a header that already has a divider, to avoid a second line. */
  baseline?: boolean;
  className?: string;
}

export function UnderlineTabs({
  tabs,
  current,
  onSelect,
  ariaLabel,
  panelIdPrefix,
  baseline = true,
  className = "",
}: UnderlineTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (index + dir + tabs.length) % tabs.length;
    onSelect(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-stretch gap-7 ${
        baseline ? "border-b-2 border-[var(--m-dim)]" : ""
      } ${className}`}
    >
      {tabs.map((tab, index) => {
        const active = tab.id === current;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active}
            aria-controls={
              panelIdPrefix ? `${panelIdPrefix}${tab.id}` : undefined
            }
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`mono-focus -mb-0.5 border-b-2 pb-3 text-[11px] leading-none font-medium tracking-[0.12em] uppercase transition-colors ${
              active
                ? "border-[var(--m-accent)] text-[var(--m-fg)]"
                : "border-transparent text-[var(--m-muted2)] hover:text-[var(--m-fg)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
