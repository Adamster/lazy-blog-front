import { Fragment, type ComponentType } from "react";
import { STEP_BOX, stepBoxClass } from "./step-box";

type StepIcon = ComponentType<{ className?: string }>;

interface StepperProps {
  steps: string[];
  icons: StepIcon[];
  current: number;
  onSelect: (step: number) => void;
  errorSteps?: number[];
  completeSteps?: number[];
  className?: string;
}

// Connectors fill on completion-based progress, NOT navigation position (Material/Ant
// style). Box precedence: error > active(filled) > complete(outline) > dim.
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
        const boxClass = hasError
          ? active
            ? "border-[var(--m-error)] bg-[var(--m-error)] text-[var(--m-bg)]"
            : "border-[var(--m-error)] bg-transparent text-[var(--m-error)]"
          : active
            ? stepBoxClass(true)
            : isComplete
              ? "border-[var(--m-accent)] bg-transparent text-[var(--m-accent)]"
              : stepBoxClass(false);
        // Connector = leg OUT of the PRECEDING step: fills once THAT step is
        // complete (data filled), not merely reached by navigation.
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
