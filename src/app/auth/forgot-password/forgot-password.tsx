"use client";

import { useForgotPassword } from "@/features/auth/model/use-forgot-password";
import { NotLazyAvatar } from "@/features/user/ui/notlazy-avatar";
import { ForgotPasswordRequest } from "@/shared/api/openapi";
import { randomMessageFromList } from "@/shared/lib/utils";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { Button, Divider, Input } from "@heroui/react";
import { useForm } from "react-hook-form";
import { FORGOT_PASSWORD_MESSAGES } from "./types";
import { useMemo } from "react";

export default function ForgotPassword() {
  const forgotPasswordMutation = useForgotPassword();

  const randomMessage = useMemo(
    () => randomMessageFromList(FORGOT_PASSWORD_MESSAGES),
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>();

  const onSubmit = (data: ForgotPasswordRequest) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <>
      <div className="layout-page">
        <div className="layout-page-content">
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
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
              variant="flat"
              color="primary"
              disabled={forgotPasswordMutation.isPending}
              isLoading={forgotPasswordMutation.isPending}
            >
              {!forgotPasswordMutation.isPending && (
                <RocketLaunchIcon className="w-4 h-4" />
              )}
              Send
            </Button>
          </form>
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-wrapper">
            <aside className="layout-page-aside-sticky">
              <NotLazyAvatar />
              <p className="text-gray text-sm">{randomMessage}</p>
            </aside>
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    </>
  );
}
