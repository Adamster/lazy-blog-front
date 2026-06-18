"use client";

import { ResetPasswordRequest } from "@/shared/api/openapi";
import { Loading } from "@/shared/ui/loading";
import { addToastError } from "@/shared/lib/toasts";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUserById } from "@/features/user/model/use-user-by-id";
import { ErrorMessage } from "@/shared/ui/error-message";
import { useResetPassword } from "@/features/auth/model/use-reset-password";
import { MonoHeader } from "@/widgets/mono-header";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

const fieldLabel = "mono-field-label";

function inputClasses(hasError: boolean) {
  return `mono-input py-2.5 pr-8 text-[15px] leading-[1.5] ${
    hasError
      ? "border-[var(--m-error)]"
      : "border-[var(--m-dim)] focus:border-[var(--m-accent)]"
  }`;
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M3 3l18 18" strokeLinecap="round" /> : null}
    </svg>
  );
}

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const userId = searchParams?.get("id") || "";
  const token = searchParams?.get("token") || "";

  const { data: user, isLoading, isError, error } = useUserById(userId);
  const resetPasswordMutation = useResetPassword(user?.email || "", token);

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        <div className="mono-label mb-3.5">{"// RESET PASSWORD"}</div>
        <h1 className="font-display text-[40px] leading-[1.02] font-bold tracking-[-0.025em]">
          Set a new password
        </h1>
        <div className="mt-3.5 mb-10 border-l-[3px] border-l-[var(--m-accent)] bg-[var(--m-accent)]/[0.06] px-3.5 py-3 text-[13px] leading-[1.6] text-[var(--m-muted)]">
          Пароль: минимум 6 символов — хотя бы одна заглавная и строчная буква,
          цифра и спецсимвол.
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          {/* New password */}
          <div className="mb-6">
            <label htmlFor="new-password" className={fieldLabel}>
              NEW PASSWORD <span className="text-[var(--m-accent)]">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="new-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPassword)}
                className={inputClasses(Boolean(errors.newPassword))}
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
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className={`absolute right-0 flex p-1 text-[var(--m-muted2)] transition-colors hover:text-[var(--m-accent)] ${focusRing}`}
              >
                <EyeIcon off={showPw} />
              </button>
            </div>
            <p
              className="min-h-[16px] text-[11px] tracking-[0.02em] text-[var(--m-error)]"
              role={errors.newPassword ? "alert" : undefined}
            >
              {errors.newPassword ? `! ${errors.newPassword.message}` : ""}
            </p>
          </div>

          {/* Confirm */}
          <div className="mb-2">
            <label htmlFor="confirm-password" className={fieldLabel}>
              CONFIRM NEW PASSWORD{" "}
              <span className="text-[var(--m-accent)]">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                className={inputClasses(Boolean(errors.confirmPassword))}
                {...register("confirmPassword", {
                  required: "Confirmation required",
                  validate: (value) =>
                    value === getValues("newPassword") ||
                    "Passwords do not match",
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className={`absolute right-0 flex p-1 text-[var(--m-muted2)] transition-colors hover:text-[var(--m-accent)] ${focusRing}`}
              >
                <EyeIcon off={showConfirm} />
              </button>
            </div>
            <p
              className="min-h-[16px] text-[11px] tracking-[0.02em] text-[var(--m-error)]"
              role={errors.confirmPassword ? "alert" : undefined}
            >
              {errors.confirmPassword
                ? `! ${errors.confirmPassword.message}`
                : ""}
            </p>
          </div>

          <button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            className={`font-display mt-6 w-full bg-[var(--m-accent)] py-4 text-[14.5px] font-bold text-[var(--m-bg)] transition-[filter] hover:brightness-110 disabled:pointer-events-none disabled:opacity-80 ${focusRing}`}
          >
            {resetPasswordMutation.isPending
              ? "Updating…"
              : "Update password →"}
          </button>
        </form>

        <p className="mt-7 text-center text-[12.5px] text-[var(--m-muted)]">
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
