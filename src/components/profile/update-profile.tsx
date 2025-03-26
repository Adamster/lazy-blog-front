import { apiClient } from "@/shared/api/api-client";
import { UpdateUserRequest, UserResponse } from "@/shared/api/openapi";
import { addToastSuccess, addToastError } from "@/components/toasts/toasts";
import { Button, Input, Textarea } from "@heroui/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";

interface IProps {
  userData: UserResponse | undefined;
}

export const UpdateProfile = ({ userData }: IProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateUserRequest>({
    shouldUseNativeValidation: false,
  });

  useEffect(() => {
    if (userData) {
      reset({
        userName: userData.userName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        biography: userData.biography,
      });
    }
  }, [userData, reset]);

  const updateUserMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) =>
      apiClient.users.updateUser({
        id: userData!.id || "",
        updateUserRequest: {
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.userName,
          biography: data.biography,
        },
      }),

    onSuccess: () => {
      addToastSuccess("Profile successfully updated!");

      queryClient.invalidateQueries({
        queryKey: ["getUserById", userData?.id],
      });
    },

    onError: (error) => {
      addToastError("Failed to update profile", error);
    },
  });

  const onSubmit = (data: UpdateUserRequest) => {
    updateUserMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-4">
        <Input
          classNames={{ input: "text-base" }}
          label="Username"
          isRequired
          isInvalid={Boolean(errors.userName)}
          errorMessage={errors.userName?.message}
          {...register("userName", {
            required: "Username is required",
            pattern: {
              value: /^[A-Za-z0-9_.-]+$/,
              message: "No spaces or special characters",
            },
          })}
        />

        <Input
          classNames={{ input: "text-base" }}
          label="First Name"
          isRequired
          isInvalid={Boolean(errors.firstName)}
          errorMessage={errors.firstName?.message}
          {...register("firstName", {
            required: "First Name is required",
            minLength: {
              value: 2,
              message: "At least 2 characters",
            },
          })}
        />

        <Input
          classNames={{ input: "text-base" }}
          label="Last Name"
          isRequired
          isInvalid={Boolean(errors.lastName)}
          errorMessage={errors.lastName?.message}
          {...register("lastName", {
            required: "Last Name is required",
            minLength: {
              value: 2,
              message: "At least 2 characters",
            },
          })}
        />

        <Textarea
          classNames={{ input: "text-base" }}
          label="About"
          isInvalid={Boolean(errors.biography)}
          errorMessage={errors.biography?.message}
          {...register("biography", {
            maxLength: {
              value: 200,
              message: "Maximum 200 characters",
            },
          })}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            color="primary"
            disabled={updateUserMutation.isPending}
            isLoading={updateUserMutation.isPending}
          >
            <RocketLaunchIcon className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>
    </form>
  );
};
