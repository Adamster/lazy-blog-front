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
          displayName: userData.displayName ?? "",
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

      <div className="mt-4">
        <Field
          id="profile-displayname"
          label="Display name"
          required
          error={errors.displayName?.message}
          {...register("displayName", {
            required: "Display name is required",
            maxLength: { value: 100, message: "Maximum 100 characters" },
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
        <div className="mt-2 text-right text-[11px] leading-none tracking-[0.12em] text-[var(--m-muted2)] tabular-nums">
          {aboutLength} / {ABOUT_MAX}
        </div>
      </div>
    </ProfileFormSection>
  );
}
