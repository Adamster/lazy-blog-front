"use client";

import { ResetPasswordRequest } from "@/shared/api/openapi";
import { Loading } from "@/shared/ui/loading";
import { addToastError } from "@/shared/lib/toasts";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { Button, Divider, Input } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useUserById } from "@/features/user/model/use-user-by-id";
import { ErrorMessage } from "@/shared/ui/error-message";
import { useResetPassword } from "@/features/auth/model/use-reset-password";
import { UserAvatar } from "@/features/user/ui/user-avatar";

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
  } = useForm<ResetPasswordRequest & { confirmPassword: string }>();

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
    <>
      <div className="layout-page">
        <div className="layout-page-content">
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <h2 className="text-lg">Reset Password</h2>

            <Input
              type="password"
              label="New password"
              isRequired
              isInvalid={Boolean(errors.newPassword)}
              errorMessage={errors.newPassword?.message}
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

            <Input
              type="password"
              label="Confirm new password"
              isRequired
              isInvalid={Boolean(errors.confirmPassword)}
              errorMessage={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Confirmation required",
                validate: (value) =>
                  value === getValues("newPassword") ||
                  "Passwords do not match",
              })}
            />

            <Button
              type="submit"
              variant="solid"
              color="primary"
              disabled={resetPasswordMutation.isPending}
              isLoading={resetPasswordMutation.isPending}
            >
              {!resetPasswordMutation.isPending && (
                <RocketLaunchIcon className="w-4 h-4" />
              )}
              Reset
            </Button>
          </form>
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            <aside className="layout-page-aside-content-sticky">
              {user && (
                <>
                  <UserAvatar user={user} />
                  <p className="text-gray text-sm">
                    Well well well... look who needs a fresh password.
                  </p>
                </>
              )}
            </aside>
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    </>
  );
}
