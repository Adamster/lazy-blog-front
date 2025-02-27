/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Spinner, User } from "@heroui/react";
import { useAuth } from "@/providers/auth-provider";
import { UpdateUserRequest } from "@/api/apis";
import { apiClient } from "@/api/api-client";
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import { addToastError, addToastSuccess } from "@/helpers/toasts";

interface LoginFormProps {
  onOpenChange: () => void;
}

export default function EditProfileForm({ onOpenChange }: LoginFormProps) {
  const { user, refetchUserData } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UpdateUserRequest & { avatar?: File }>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.userName || "",
    },
    shouldUseNativeValidation: false,
  });

  const avatarFile = watch("avatar");

  useEffect(() => {
    if (avatarFile && typeof avatarFile !== "string") {
      setAvatarPreview(URL.createObjectURL(avatarFile));
    }
  }, [avatarFile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("avatar", file);
    }
  };

  const onSubmit = async (data: UpdateUserRequest & { avatar?: File }) => {
    setLoading(true);

    try {
      if (user?.id) {
        await apiClient.users.updateUser({
          id: user.id,
          updateUserRequest: {
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
          },
        });

        if (data.avatar) {
          await apiClient.users.uploadUserAvatar({
            id: user.id,
            file: data.avatar,
          });
        }

        refetchUserData();
        addToastSuccess("Profile successfully updated!");
        onOpenChange();
      }
    } catch (error: any) {
      addToastError("Failed to update profile", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-4">
        <label className="cursor-pointer">
          <User
            avatarProps={{
              size: "md",
              src: avatarPreview,
              fallback: <ArrowUpTrayIcon className="w-4 h-4" />,
            }}
            name={`${watch("firstName") || ""} ${watch("lastName") || ""}`}
            description={`@${watch("username") || ""}`}
          />

          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </label>

        <Input
          classNames={{ input: "text-base" }}
          label="Username"
          isRequired
          isInvalid={Boolean(errors.username)}
          errorMessage={errors.username?.message}
          {...register("username", {
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

        <Button type="submit" color="primary" isLoading={loading}>
          {loading ? <Spinner size="sm" /> : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
