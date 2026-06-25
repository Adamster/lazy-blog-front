"use client";

import { useForm } from "react-hook-form";
import type { ChangePasswordRequest } from "@/shared/api/openapi";
import { Field, InfoBox } from "@/shared/ui";
import { useUpdatePassword } from "../model/use-update-password";
import { ProfileFormSection } from "./profile-form-section";

interface FormValues extends ChangePasswordRequest {
  confirmPassword: string;
}

// Password strength: ≥6 chars with lower, upper, digit and a special char.
const PASSWORD_PATTERN = {
  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
  message:
    "At least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
} as const;

/**
 * Security-tab password form — RHF over the {@link useUpdatePassword} mutation
 * (success toast + home redirect + sign-out), wrapped in the shared
 * {@link ProfileFormSection} chrome. The password-rules info box reuses the
 * accent-left-edge treatment from the brand sheet / auth lead. The sign-out
 * heads-up lives on the left {@link ProfileSecurityIntro} context panel, so the
 * form starts at the Current-password field.
 */
export function ProfileSecurityForm() {
  const changePassword = useUpdatePassword();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ shouldUseNativeValidation: false });

  return (
    <ProfileFormSection
      onSubmit={handleSubmit(({ oldPassword, newPassword }) =>
        changePassword.mutate({ oldPassword, newPassword })
      )}
      actionLabel="Update password"
      pending={changePassword.isPending}
    >
      <Field
        id="pass-current"
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        error={errors.oldPassword?.message}
        {...register("oldPassword", {
          required: "Current password required",
        })}
      />

      <div className="mt-4">
        <Field
          id="pass-new"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.newPassword?.message}
          {...register("newPassword", {
            required: "New password required",
            minLength: { value: 6, message: "At least 6 characters" },
            pattern: PASSWORD_PATTERN,
          })}
        />
      </div>

      <div className="mt-4">
        <Field
          id="pass-confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Confirmation required",
            validate: (value) =>
              value === getValues("newPassword") || "Passwords do not match",
          })}
        />
      </div>

      {/* Requirements hint sits BELOW all the inputs (consistent with the auth
          register form), not wedged between New and Confirm. */}
      <InfoBox className="mt-4">
        Use 6+ characters with at least one uppercase, one lowercase, a number,
        and a special character.
      </InfoBox>
    </ProfileFormSection>
  );
}
