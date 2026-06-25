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
  InfoBox,
  Modal,
  ModalHeader,
  SubmitButton,
  useModalTitleId,
} from "@/shared/ui";

// Password strength: ≥6 chars with lower, upper, digit and a special char.
const PASSWORD_PATTERN = {
  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
  message:
    "At least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
} as const;

/**
 * Reset-password route. The auth {@link Modal} is open by default with the
 * reset form INSIDE it — one visual language for the whole auth flow (no
 * bespoke full-page layout). This is the TERMINAL step of recovery: there's no
 * "back" control; closing OR a successful reset returns home, where the standard
 * auth modal can take over.
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

  const goHome = () => router.push("/");

  const onSubmit = (data: ResetPasswordRequest) => {
    if (token && user?.id) {
      // Terminal step of the recovery flow: on success, close the modal and
      // return home where the standard auth modal can take over.
      resetPasswordMutation.mutate(data, { onSuccess: goHome });
    } else {
      addToastError("Very Funny :)");
    }
  };

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
            subtitle="Brain too lazy to hold the old password? Fair enough — fresh one below."
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

            {/* Requirements hint BELOW all inputs (consistent with register). */}
            <InfoBox className="mb-6">
              Use 6+ characters with at least one uppercase, one lowercase, a
              number, and a special character.
            </InfoBox>

            <SubmitButton
              pending={resetPasswordMutation.isPending}
              pendingLabel="Updating…"
            >
              Update password
            </SubmitButton>
          </form>
        </>
      )}
    </Modal>
  );
}
