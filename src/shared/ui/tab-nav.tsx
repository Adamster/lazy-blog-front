import { Fragment } from "react";
import { STEP_BOX, stepBoxClass } from "./step-box";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

export interface TabItem {
  /** Stable id — the value reported by `onSelect` and matched against `current`. */
  id: string;
  /** Single-letter box marker (e.g. `P` / `S`). */
  marker: string;
  /** Visible uppercase label beside the marker. */
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
 * The edit-profile tab band — the composer {@link Stepper}'s visual language
 * (the shared `STEP_BOX` + `stepBoxClass` active/inactive tokens) re-dressed as
 * free-switch tabs: a LETTER marker box + an uppercase text label, joined by a
 * dashed connector. Carries true tab a11y (`role="tablist"` / `role="tab"` /
 * `aria-selected` / `aria-controls`) rather than the stepper's `aria-current`,
 * and switching is unconditional (no forward/back gate). Box sizing/colours stay
 * byte-identical to the composer steps via the shared `step-box` helpers.
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
      className={`flex items-center gap-2.5 ${className}`}
    >
      {tabs.map((tab, i) => {
        const active = tab.id === current;
        return (
          <Fragment key={tab.id}>
            {i > 0 ? (
              <span
                aria-hidden="true"
                className="h-0 w-7 border-t-2 border-dashed border-[var(--m-dim)] md:w-14"
              />
            ) : null}
            <button
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active}
              aria-controls={
                panelIdPrefix ? `${panelIdPrefix}${tab.id}` : undefined
              }
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              className={`group flex min-h-10 items-center gap-2.5 ${focusRing}`}
            >
              <span
                aria-hidden="true"
                className={`${STEP_BOX} ${stepBoxClass(active)}`}
              >
                {tab.marker}
              </span>
              <span
                className={`text-[11px] leading-none font-medium tracking-[0.12em] uppercase transition-colors ${
                  active
                    ? "text-[var(--m-accent)]"
                    : "text-[var(--m-muted2)] group-hover:text-[var(--m-accent)]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
