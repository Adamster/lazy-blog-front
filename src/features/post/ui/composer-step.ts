import type { FieldErrors } from "react-hook-form";
import type { UpdatePostRequest } from "@/shared/api/openapi";

/** The two steps of the post composer: 1 = Setup, 2 = Write. */
export type ComposerStep = 1 | 2;

/** Setup-step (1) fields. */
export const STEP1_FIELDS = ["title", "summary"] as const;

/** Write-step (2) fields. */
export const STEP2_FIELDS = ["body"] as const;

/** The 1-based steps that currently hold validation errors (for the Stepper). */
export const errorStepsFrom = (
  errors: FieldErrors<UpdatePostRequest>
): ComposerStep[] => {
  const steps: ComposerStep[] = [];
  if (STEP1_FIELDS.some((f) => errors[f])) steps.push(1);
  if (STEP2_FIELDS.some((f) => errors[f])) steps.push(2);
  return steps;
};

/** The FIRST step holding an error, or `null` when the form is clean. */
export const firstErrorStep = (
  errors: FieldErrors<UpdatePostRequest>
): ComposerStep | null => errorStepsFrom(errors)[0] ?? null;
