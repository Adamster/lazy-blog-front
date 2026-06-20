"use client";

import { useForm } from "react-hook-form";
import { ChangePasswordRequest } from "@/shared/api/openapi";
import { Field, SubmitButton } from "@/shared/ui";
import { useUpdatePassword } from "../model/use-update-password";

interface FormValues extends ChangePasswordRequest {
  confirmPassword: string;
}

// Password strength: ≥6 chars with lower, upper, digit and a special char.
const PASSWORD_PATTERN = {
  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
  message:
    "At least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
} as const;

/** Profile "Change password" form — current / new / confirm on the design system. */
export const UpdatePasswordForm = () => {
  const changePasswordMutation = useUpdatePassword();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ shouldUseNativeValidation: false });

  const onSubmit = (data: FormValues) =>
    changePasswordMutation.mutate({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
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
      </div>

      <div className="mb-4">
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

      <p className="mt-4 text-[12px] leading-[1.6] text-[var(--m-muted)]">
        For security reasons, you will be logged out after changing your
        password.
      </p>

      <div className="mt-4">
        <SubmitButton
          pending={changePasswordMutation.isPending}
          pendingLabel="Saving…"
        >
          Change password →
        </SubmitButton>
      </div>
    </form>
  );
};
