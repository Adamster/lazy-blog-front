"use client";

import { ResetPasswordRequest } from "@/shared/api/openapi";
import { Loading } from "@/shared/ui/loading";
import { addToastError } from "@/shared/lib/toasts";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useUserById } from "@/features/user/model/use-user-by-id";
import { ErrorMessage } from "@/shared/ui/error-message";
import { useResetPassword } from "@/features/auth/model/use-reset-password";
import { Field, SubmitButton } from "@/shared/ui";
import { MonoHeader } from "@/widgets/mono-header";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const userId = searchParams?.get("id") || "";
  const token = searchParams?.get("token") || "";

  const { data: user, isLoading, isError, error } = useUserById(userId);
  const resetPasswordMutation = useResetPassword(user?.email || "", token);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetPasswordRequest & { confirmPassword: string }>({
    shouldUseNativeValidation: false,
  });

  const onSubmit = (data: ResetPasswordRequest) => {
    if (token && user?.id) {
      resetPasswordMutation.mutate(data);
    } else {
      addToastError("Very Funny :)");
    }
  };

  if (!userId) return <ErrorMessage error={"Not Found."} />;
  if (isLoading) return <Loading />;
  if (isError) return <ErrorMessage error={error} />;

  return (
    <div
      className="mono-scope mx-[calc(50%-50vw)] min-h-screen w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <MonoHeader />

      <main className="mx-auto max-w-[468px] px-10 pt-28 pb-24">
        <div className="mono-label mb-2">{"// RESET PASSWORD"}</div>
        <h1 className="font-display text-[40px] leading-[1.04] font-bold tracking-[-0.02em]">
          Set a new password
        </h1>
        <div className="mt-4 mb-7 border-l-2 border-l-[var(--m-accent)] bg-[var(--m-accent)]/[0.06] px-4 py-3 text-[14px] leading-[1.6] text-[var(--m-muted)]">
          Make it count: 6+ characters with at least one uppercase, one
          lowercase, a number, and a special character.
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          {/* New password */}
          <div className="mb-4">
            <Field
              id="new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              error={errors.newPassword?.message}
              {...register("newPassword", {
                required: "New password required",
                minLength: { value: 6, message: "At least 6 characters" },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
                  message:
                    "At least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
                },
              })}
            />
          </div>

          {/* Confirm */}
          <div className="mb-4">
            <Field
              id="confirm-password"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Confirmation required",
                validate: (value) =>
                  value === getValues("newPassword") ||
                  "Passwords do not match",
              })}
            />
          </div>

          <SubmitButton
            pending={resetPasswordMutation.isPending}
            pendingLabel="Updating…"
          >
            Update password →
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-[14px] text-[var(--m-muted)]">
          ←{" "}
          <Link
            href="/"
            className={`font-semibold text-[var(--m-accent)] underline-offset-2 hover:underline ${focusRing}`}
          >
            Back to Log in
          </Link>
        </p>
      </main>
    </div>
  );
}
