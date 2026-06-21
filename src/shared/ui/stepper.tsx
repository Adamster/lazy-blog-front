import { Fragment } from "react";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface StepperProps {
  /** Step labels (used for a11y); the visible marker is the 1-based number. */
  steps: string[];
  /** 1-based active step. */
  current: number;
  /** Jump to a step (the parent validates forward moves). */
  onSelect: (step: number) => void;
  className?: string;
}

/**
 * Numbered square step boxes (`1` / `2` …) joined by connectors. Active = filled
 * accent with a bg-coloured number; inactive = dim border + muted2 number that
 * goes accent on hover. The connector leading into a reached step turns accent.
 * Every box is clickable (free jump) — the parent gates forward navigation.
 */
export function Stepper({
  steps,
  current,
  onSelect,
  className = "",
}: StepperProps) {
  return (
    <nav
      aria-label="Steps"
      className={`flex items-center gap-1.5 md:gap-2.5 ${className}`}
    >
      {steps.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        return (
          <Fragment key={step}>
            {i > 0 ? (
              <span
                aria-hidden="true"
                className={`h-0.5 w-14 transition-colors ${
                  current >= step ? "bg-[var(--m-accent)]" : "bg-[var(--m-dim)]"
                }`}
              />
            ) : null}
            <button
              type="button"
              onClick={() => onSelect(step)}
              aria-current={active ? "step" : undefined}
              aria-label={`Go to step ${step}: ${label}`}
              className={`group flex size-10 items-center justify-center ${focusRing}`}
            >
              <span
                aria-hidden="true"
                className={`flex size-8 items-center justify-center border-2 text-[12px] leading-none font-semibold transition-colors ${
                  active
                    ? "border-[var(--m-accent)] bg-[var(--m-accent)] text-[var(--m-bg)]"
                    : "border-[var(--m-dim)] bg-transparent text-[var(--m-muted2)] group-hover:border-[var(--m-accent)] group-hover:text-[var(--m-accent)]"
                }`}
              >
                {step}
              </span>
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}
