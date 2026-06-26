"use client";

import { useRef } from "react";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

export interface UnderlineTabItem {
  /** Stable id — reported by `onSelect` and matched against `current`. */
  id: string;
  /** Visible uppercase label. */
  label: string;
}

interface UnderlineTabsProps {
  tabs: readonly UnderlineTabItem[];
  /** id of the active tab. */
  current: string;
  /** Free-switch select (no validation gate). */
  onSelect: (id: string) => void;
  /** `aria-label` for the tablist. */
  ariaLabel: string;
  /** Wires `aria-controls`/`id` on each tab to its panel (`${idPrefix}${id}`). */
  panelIdPrefix?: string;
  /** The 2px `--m-dim` baseline under the row. Set `false` to show ONLY the
   *  active-tab accent underline (e.g. under a header that already has a
   *  divider), so the row doesn't carry a second full line. */
  baseline?: boolean;
  className?: string;
}

/**
 * The plainer underline tab bar — a 2px `--m-dim` baseline with an accent
 * underline on the active tab (no marker boxes; the lighter chrome of a
 * reference index, as opposed to {@link TabNav}'s letter-box steps). Labels are
 * 11px / 0.12em uppercase, pinned `leading-none`. Roving tabindex + arrow
 * navigation, full tab a11y (`role="tablist"` / `role="tab"` / `aria-selected`).
 */
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
            className={`-mb-0.5 border-b-2 pb-3 text-[11px] leading-none font-medium tracking-[0.12em] uppercase transition-colors ${focusRing} ${
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
