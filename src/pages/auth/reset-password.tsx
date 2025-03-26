import { apiClient } from "@/shared/api/api-client";
import { ResetPasswordRequest } from "@/shared/api/openapi";
import { Loading } from "@/shared/ui/loading";
import { addToastError, addToastSuccess } from "@/components/toasts/toasts";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { Button, Divider, Input, User } from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { GenerateMeta } from "@/shared/lib/head/meta-data";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const userId = searchParams?.get("id") || "";
  const token = searchParams?.get("token") || "";

  const { data: user, isLoading } = useQuery({
    queryKey: ["getUserById", userId],
    queryFn: () => apiClient.users.getUserById({ id: userId }),
    enabled: Boolean(userId),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetPasswordRequest & { confirmPassword: string }>();

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => {
      return apiClient.resetPassword.resetPassword({
        resetPasswordRequest: { ...data, email: user?.email || "", token },
      });
    },
    onSuccess: () => {
      addToastSuccess("Your password has been reset successfully!");
    },
    onError: (error) => {
      addToastError("Password reset failed.", error);
    },
  });

  const onSubmit = (data: ResetPasswordRequest) => {
    if (token || user?.id) {
      mutation.mutate(data);
    } else {
      addToastError("Very Funny :)");
    }
  };

  return (
    <>
      <GenerateMeta title="Reset Password" />

      <div className="layout-page">
        <div className="layout-page-content">
          <form
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
              disabled={mutation.isPending}
              isLoading={mutation.isPending}
            >
              {!mutation.isPending && <RocketLaunchIcon className="w-4 h-4" />}
              Reset
            </Button>
          </form>
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            {isLoading && <Loading inline />}
            {
              <aside className="layout-page-aside-content-sticky">
                <User
                  key={user?.id || ""}
                  avatarProps={{
                    size: "md",
                    src: user?.avatarUrl || undefined,
                    name: user
                      ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(
                          0
                        )}`
                      : "404",
                  }}
                  name={
                    user
                      ? `${user.firstName} ${user.lastName}`
                      : "User Not Found"
                  }
                  description={"@" + user?.userName}
                />
              </aside>
            }
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    </>
  );
}
