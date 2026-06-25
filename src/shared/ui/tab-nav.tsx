import { Fragment, type ComponentType } from "react";
import { STEP_BOX, stepBoxClass } from "./step-box";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

type TabIcon = ComponentType<{ className?: string }>;

export interface TabItem {
  /** Stable id — the value reported by `onSelect` and matched against `current`. */
  id: string;
  /** Icon rendered INSIDE the box (replaces the old letter marker). */
  icon: TabIcon;
  /** Accessible name (`aria-label`) — the visible box content is the icon. */
  label: string;
}

interface TabNavProps {
  tabs: TabItem[];
  /** id of the active tab. */
  current: string;
  /** Free-switch select (no validation gate — tabs, not steps). */
  onSelect: (id: string) => void;
  /** Wires `aria-controls` on each tab to its panel id (`${idPrefix}${id}`). */
  panelIdPrefix?: string;
  className?: string;
}

/**
 * The edit-profile tab band — TABS, not a progress stepper. It borrows the
 * composer {@link Stepper}'s box language (the shared `STEP_BOX` +
 * `stepBoxClass` tokens), but reads as tabs: only the ACTIVE box highlights
 * (accent), the inactive boxes stay dim, and the connector is a STATIC dim rule
 * (NOT a progress bar — it never goes accent). The section name is a11y-only
 * (`aria-label`), so there's no visible text (icons only). Carries true tab a11y
 * (`role="tablist"` / `role="tab"` / `aria-selected` / `aria-controls`) and
 * switching is unconditional (no forward/back gate).
 */
export function TabNav({
  tabs,
  current,
  onSelect,
  panelIdPrefix,
  className = "",
}: TabNavProps) {
  return (
    <div
      role="tablist"
      aria-label="Edit profile sections"
      className={`flex items-center gap-1.5 md:gap-2.5 ${className}`}
    >
      {tabs.map((tab, i) => {
        const active = tab.id === current;
        const Icon = tab.icon;
        return (
          <Fragment key={tab.id}>
            {i > 0 ? (
              <span
                aria-hidden="true"
                className="h-0.5 w-7 bg-[var(--m-dim)] md:w-14"
              />
            ) : null}
            <button
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active}
              aria-label={tab.label}
              aria-controls={
                panelIdPrefix ? `${panelIdPrefix}${tab.id}` : undefined
              }
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              className={`group flex size-10 items-center justify-center ${focusRing}`}
            >
              <span
                aria-hidden="true"
                className={`${STEP_BOX} ${stepBoxClass(active)}`}
              >
                <Icon className="size-4" />
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
