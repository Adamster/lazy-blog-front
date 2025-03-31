import { Button, Input } from "@heroui/react";
import { useForm } from "react-hook-form";
import { ChangePasswordRequest } from "@/shared/api/openapi";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { useUpdatePassword } from "../model/use-update-password";

interface FormValues extends ChangePasswordRequest {
  confirmPassword: string;
}

export const UpdatePasswordForm = () => {
  const changePasswordMutation = useUpdatePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormValues>();

  const onSubmit = (data: FormValues) => {
    changePasswordMutation.mutate({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-4">
        <Input
          type="password"
          label="Current password"
          isRequired
          isInvalid={Boolean(errors.oldPassword)}
          errorMessage={errors.oldPassword?.message}
          {...register("oldPassword", {
            required: "Current password required",
          })}
        />

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
              value === getValues("newPassword") || "Passwords do not match",
          })}
        />

        <p className="text-gray">
          <small>
            For security reasons, you will be logged out after changing your
            password.
          </small>
        </p>

        <div className="flex justify-end">
          <Button
            type="submit"
            color="primary"
            disabled={changePasswordMutation.isPending}
            isLoading={changePasswordMutation.isPending}
          >
            <RocketLaunchIcon className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>
    </form>
  );
};
