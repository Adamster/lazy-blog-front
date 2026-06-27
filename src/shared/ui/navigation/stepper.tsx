import { Fragment, type ComponentType } from "react";
import { STEP_BOX, stepBoxClass } from "./step-box";

type StepIcon = ComponentType<{ className?: string }>;

interface StepperProps {
  /** Step names — a11y labels only (the visible box content is the icon). */
  steps: string[];
  /** Icon per step, rendered INSIDE the box (replaces the old number). Index-aligned with `steps`. */
  icons: StepIcon[];
  /** 1-based active step. */
  current: number;
  /** Jump to a step (navigation is unconditional; the parent decides). */
  onSelect: (step: number) => void;
  /** 1-based steps that currently hold validation errors (error visual layer). */
  errorSteps?: number[];
  /**
   * 1-based steps whose required DATA is present (filled) — gets the accent
   * OUTLINE "complete" layer when it's not the active step (active wins, filled).
   */
  completeSteps?: number[];
  className?: string;
}

/**
 * Square step boxes joined by connectors — each box holds an ICON for its step
 * (setup / write). Active = filled accent with a bg-coloured icon; a COMPLETE
 * (data-present) but non-active step = accent OUTLINE (border + icon, no fill);
 * inactive + incomplete = dim border + muted2 icon that goes accent on hover.
 * The connector leading OUT of a COMPLETE step turns accent (Material/Ant style
 * — completion-based progress, not navigation position). Every box is clickable
 * (free jump). A step in `errorSteps` gets an additive `--m-error` border/icon
 * layer (highest precedence). Box precedence: error > active(filled) >
 * complete(outline) > dim. The step name is a11y-only (`aria-label`), so phones
 * and desktop look identical — just icons.
 */
export function Stepper({
  steps,
  icons,
  current,
  onSelect,
  errorSteps,
  completeSteps,
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
        const isComplete = completeSteps?.includes(step) ?? false;
        // Box precedence: error > active(filled) > complete(outline) > dim. The
        // error layer overrides the shared box language with `--m-error`; an
        // active step is the filled-accent box; a complete-but-not-active step
        // is the accent OUTLINE (done, yet distinct from the filled active box);
        // otherwise the canonical dim box (shared with TabNav).
        const boxClass = hasError
          ? active
            ? "border-[var(--m-error)] bg-[var(--m-error)] text-[var(--m-bg)]"
            : "border-[var(--m-error)] bg-transparent text-[var(--m-error)]"
          : active
            ? stepBoxClass(true)
            : isComplete
              ? "border-[var(--m-accent)] bg-transparent text-[var(--m-accent)]"
              : stepBoxClass(false);
        // Connector = the leg OUT of the PRECEDING step (Material/Ant style): it
        // fills accent once THAT step is COMPLETE (its data is filled) — not
        // merely "reached" by navigation — red if that step errors, dim
        // otherwise. So a green segment means "that leg is done", consistent
        // with the boxes' completion accent.
        const prevDone = completeSteps?.includes(step - 1) ?? false;
        const prevError = errorSteps?.includes(step - 1) ?? false;
        const connectorClass = prevError
          ? "bg-[var(--m-error)]"
          : prevDone
            ? "bg-[var(--m-accent)]"
            : "bg-[var(--m-dim)]";
        const Icon = icons[i];
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
              className={`group mono-focus flex size-10 items-center justify-center`}
            >
              <span aria-hidden="true" className={`${STEP_BOX} ${boxClass}`}>
                <Icon className="size-4" />
              </span>
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}
