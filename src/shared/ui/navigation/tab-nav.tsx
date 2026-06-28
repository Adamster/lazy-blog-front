import { Fragment, type ComponentType } from "react";
import { STEP_BOX, stepBoxClass } from "./step-box";

type TabIcon = ComponentType<{ className?: string }>;

export interface TabItem {
  id: string;
  icon: TabIcon;
  label: string;
}

interface TabNavProps {
  tabs: TabItem[];
  current: string;
  onSelect: (id: string) => void;
  panelIdPrefix?: string;
  className?: string;
}

// TABS, not a stepper: borrows the Stepper box language but the connector is a
// STATIC dim rule (never goes accent) and only the active box highlights.
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
              className={`group mono-focus flex size-10 items-center justify-center`}
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
