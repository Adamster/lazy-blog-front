"use client";

import { useForm } from "react-hook-form";
import type { UpdateUserRequest, UserResponse } from "@/shared/api/openapi";
import { Field, Textarea } from "@/shared/ui";
import { useUpdateUser } from "../model/use-update-user";
import { ProfileFormSection } from "./profile-form-section";

const ABOUT_MAX = 200;

interface ProfileIdentityFormProps {
  userData: UserResponse | undefined;
}

/**
 * Profile-tab identity form — RHF over the {@link useUpdateUser} mutation
 * (success toast + cache invalidation), wrapped in the shared
 * {@link ProfileFormSection} chrome (fields → Save changes). About carries a
 * live char counter like the composer Summary.
 */
export function ProfileIdentityForm({ userData }: ProfileIdentityFormProps) {
  const updateUser = useUpdateUser(userData?.id ?? "");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateUserRequest>({
    shouldUseNativeValidation: false,
    values: userData
      ? {
          userName: userData.userName ?? "",
          firstName: userData.firstName ?? "",
          lastName: userData.lastName ?? "",
          biography: userData.biography ?? null,
        }
      : undefined,
  });

  const aboutLength = (watch("biography") ?? "").length;

  return (
    <ProfileFormSection
      onSubmit={handleSubmit((data) => updateUser.mutate(data))}
      actionLabel="Save changes"
      pending={updateUser.isPending}
    >
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

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="mt-4">
        <Textarea
          id="profile-biography"
          label="About"
          rows={4}
          error={errors.biography?.message}
          {...register("biography", {
            maxLength: {
              value: ABOUT_MAX,
              message: `Maximum ${ABOUT_MAX} characters`,
            },
          })}
        />
        <div className="mt-1.5 text-right text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] tabular-nums">
          {aboutLength} / {ABOUT_MAX}
        </div>
      </div>
    </ProfileFormSection>
  );
}
