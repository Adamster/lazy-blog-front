"use client";

import { useForm } from "react-hook-form";
import { UpdateUserRequest, UserResponse } from "@/shared/api/openapi";
import { Field, SubmitButton, Textarea } from "@/shared/ui";
import { useUpdateUser } from "../model/use-update-user";

interface UpdateUserFormProps {
  userData: UserResponse | undefined;
}

/** Profile "Edit profile" form — username / names / biography on the design system. */
export const UpdateUserForm = ({ userData }: UpdateUserFormProps) => {
  const updateUserMutation = useUpdateUser(userData?.id ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserRequest>({
    shouldUseNativeValidation: false,
    // `values` keeps the form in sync with fetched user data without an effect:
    // it resets fields whenever `userData` resolves / changes. Coerce the
    // (nullable) response fields to the non-null shape `UpdateUserRequest` wants.
    values: userData
      ? {
          userName: userData.userName ?? "",
          firstName: userData.firstName ?? "",
          lastName: userData.lastName ?? "",
          biography: userData.biography ?? null,
        }
      : undefined,
  });

  const onSubmit = (data: UpdateUserRequest) => updateUserMutation.mutate(data);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <Field
          id="profile-username"
          label="Username"
          required
          error={errors.userName?.message}
          {...register("userName", {
            required: "Username is required",
            pattern: {
              value: /^[A-Za-z0-9_.-]+$/,
              message: "No spaces or special characters",
            },
          })}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="profile-firstname"
          label="First name"
          required
          error={errors.firstName?.message}
          {...register("firstName", {
            required: "First Name is required",
            minLength: { value: 2, message: "At least 2 characters" },
          })}
        />
        <Field
          id="profile-lastname"
          label="Last name"
          required
          error={errors.lastName?.message}
          {...register("lastName", {
            required: "Last Name is required",
            minLength: { value: 2, message: "At least 2 characters" },
          })}
        />
      </div>

      <div className="mb-4">
        <Textarea
          id="profile-biography"
          label="About"
          rows={4}
          error={errors.biography?.message}
          {...register("biography", {
            maxLength: { value: 200, message: "Maximum 200 characters" },
          })}
        />
      </div>

      <SubmitButton
        pending={updateUserMutation.isPending}
        pendingLabel="Saving…"
      >
        Save changes →
      </SubmitButton>
    </form>
  );
};
