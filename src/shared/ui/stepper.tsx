import { Fragment } from "react";
import { STEP_BOX, stepBoxClass } from "./step-box";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

interface StepperProps {
  /** Step labels (used for a11y); the visible marker is the 1-based number. */
  steps: string[];
  /** 1-based active step. */
  current: number;
  /** Jump to a step (navigation is unconditional; the parent decides). */
  onSelect: (step: number) => void;
  /** 1-based steps that currently hold validation errors (error visual layer). */
  errorSteps?: number[];
  className?: string;
}

/**
 * Numbered square step boxes (`1` / `2` …) joined by connectors. Active = filled
 * accent with a bg-coloured number; inactive = dim border + muted2 number that
 * goes accent on hover. The connector leading into a reached step turns accent.
 * Every box is clickable (free jump) — navigation is unconditional. A step listed
 * in `errorSteps` gets an additive `--m-error` border/number layer (the active /
 * inactive language stays intact; error just recolours the box).
 */
export function Stepper({
  steps,
  current,
  onSelect,
  errorSteps,
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
        const hasError = errorSteps?.includes(step) ?? false;
        // Error layer overrides the shared active/inactive box language with
        // `--m-error`; otherwise it's the canonical step box (shared with TabNav).
        const boxClass = hasError
          ? active
            ? "border-[var(--m-error)] bg-[var(--m-error)] text-[var(--m-bg)]"
            : "border-[var(--m-error)] bg-transparent text-[var(--m-error)]"
          : stepBoxClass(active);
        const reached = current >= step;
        // Connector matches the boxes it bridges: red if either reached end
        // holds an error (so a green line never runs between red boxes),
        // accent once reached, dim before.
        const connectorClass =
          reached && (hasError || (errorSteps?.includes(step - 1) ?? false))
            ? "bg-[var(--m-error)]"
            : reached
              ? "bg-[var(--m-accent)]"
              : "bg-[var(--m-dim)]";
        return (
          <Fragment key={step}>
            {i > 0 ? (
              <span
                aria-hidden="true"
                className={`h-0.5 w-7 transition-colors md:w-14 ${connectorClass}`}
              />
            ) : null}
            <button
              type="button"
              onClick={() => onSelect(step)}
              aria-current={active ? "step" : undefined}
              aria-label={
                hasError
                  ? `Go to step ${step}: ${label} (has errors)`
                  : `Go to step ${step}: ${label}`
              }
              className={`group flex size-10 items-center justify-center ${focusRing}`}
            >
              <span aria-hidden="true" className={`${STEP_BOX} ${boxClass}`}>
                {step}
              </span>
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}
