import type { FieldErrors } from "react-hook-form";
import type { UpdatePostRequest } from "@/shared/api/openapi";

export type ComposerStep = 1 | 2;

export const STEP1_FIELDS = ["title", "summary"] as const;

export const STEP2_FIELDS = ["body"] as const;

export const errorStepsFrom = (
  errors: FieldErrors<UpdatePostRequest>
): ComposerStep[] => {
  const steps: ComposerStep[] = [];
  if (STEP1_FIELDS.some((f) => errors[f])) steps.push(1);
  if (STEP2_FIELDS.some((f) => errors[f])) steps.push(2);
  return steps;
};

export const firstErrorStep = (
  errors: FieldErrors<UpdatePostRequest>
): ComposerStep | null => errorStepsFrom(errors)[0] ?? null;

// Data-PRESENCE, not full validation. The caller supplies the predicates so the
// "real content" rule (whitespace / empty-doc stripping) stays owned by the form.
export const completeStepsFrom = (filled: {
  setup: boolean;
  write: boolean;
}): ComposerStep[] => {
  const steps: ComposerStep[] = [];
  if (filled.setup) steps.push(1);
  if (filled.write) steps.push(2);
  return steps;
};
