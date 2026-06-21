"use client";

import { ResetPasswordRequest } from "@/shared/api/openapi";
import { Loading } from "@/shared/ui/loading";
import { addToastError } from "@/shared/lib/toasts";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useUserById } from "@/entities/session";
import { ErrorMessage } from "@/shared/ui/error-message";
import { useResetPassword } from "@/features/auth/model/use-reset-password";
import {
  Field,
  Modal,
  ModalHeader,
  SubmitButton,
  useModalTitleId,
} from "@/shared/ui";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

// Password strength: ≥6 chars with lower, upper, digit and a special char.
const PASSWORD_PATTERN = {
  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
  message:
    "At least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
} as const;

/**
 * Reset-password route. The auth {@link Modal} is open by default with the
 * reset form INSIDE it — one visual language for the whole auth flow (no
 * bespoke full-page layout). Closing / "Back to Log in" returns home, where the
 * standard auth modal can take over.
 */
export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams?.get("id") || "";
  const token = searchParams?.get("token") || "";

  const { data: user, isLoading, isError, error } = useUserById(userId);
  const resetPasswordMutation = useResetPassword(user?.email || "", token);
  const titleId = useModalTitleId();

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

  const goHome = () => router.push("/");

  if (!userId) return <ErrorMessage error={"Not Found."} />;
  if (isLoading) return <Loading />;
  if (isError) return <ErrorMessage error={error} />;

  return (
    <Modal isOpen onOpenChange={goHome} labelledBy={titleId}>
      {(onClose) => (
        <>
          <ModalHeader
            eyebrow="// RESET PASSWORD"
            title="Set a new password"
            titleId={titleId}
            subtitle="Make it count: 6+ characters with at least one uppercase, one lowercase, a number, and a special character."
            onClose={onClose}
          />

          <form noValidate onSubmit={handleSubmit(onSubmit)}>
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
                  pattern: PASSWORD_PATTERN,
                })}
              />
            </div>

            <div className="mb-6">
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
              Update password
            </SubmitButton>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={goHome}
              className={`inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted2)] uppercase transition-colors hover:text-[var(--m-muted)] ${focusRing}`}
            >
              <span aria-hidden="true">←</span>
              Back to Log in
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
