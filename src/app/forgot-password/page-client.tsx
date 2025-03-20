"use client";

import { apiClient } from "@/api/api-client";
import { addToastError, addToastSuccess } from "@/components/toasts/toasts";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import { Button, Divider, Input, User } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

interface FormData {
  email: string;
}

const messages = [
  "Forgot again? Passwords aren’t Pokémon, you don’t need to catch them all!",
  "Even Sherlock would struggle to remember all these passwords.",
  "Oops… looks like your brain did a factory reset.",
  "Another password lost in the void… Let’s get it back!",
  "If only remembering passwords was as easy as forgetting them…",
  "Don't panic! We’ve all been here before.",
  "Your memory might be full, but your inbox isn’t. Check it!",
  "Lost your password? Let’s go on a rescue mission!",
  "Your password ran away, but we’ll help you find it.",
  "Did You Try ‘Password123’?",
];

export default function ForgotPasswordClient() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      return apiClient.forgotPassword.forgotPassword({
        forgotPasswordRequest: { email: data.email },
      });
    },
    onSuccess: () => {
      addToastSuccess("Password reset link sent to your email!");
    },
    onError: (error) => {
      addToastError("Failed to send reset link.", error);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const randomMessage = useMemo(
    () => messages[Math.floor(Math.random() * messages.length)],
    []
  );

  return (
    <div className="layout-page">
      <div className="layout-page-content">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <h2 className="text-lg">Forgot Password ?</h2>

          <Input
            classNames={{ input: "text-base" }}
            label="Email"
            type="email"
            isRequired
            isInvalid={Boolean(errors.email)}
            errorMessage={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Enter a valid email address",
              },
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
            Send
          </Button>
        </form>
      </div>

      <div className="layout-page-aside">
        <Divider className="layout-page-divider" orientation="vertical" />

        <div className="layout-page-aside-content">
          <aside className="layout-page-aside-content-sticky">
            <User
              avatarProps={{
                size: "md",
                fallback: <UserIcon className="w-4 h-4" />,
              }}
              name={`Memory Not Found`}
              description={"@404"}
            />

            <p className="text-gray text-sm">{randomMessage}</p>
          </aside>
        </div>

        <Divider className="layout-page-divider-mobile" />
      </div>
    </div>
  );
}
