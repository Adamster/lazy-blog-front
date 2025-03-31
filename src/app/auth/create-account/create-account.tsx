/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { NotLazyAvatar } from "@/features/user/ui/notlazy-avatar";
import { RegisterUserRequest } from "@/shared/api/openapi";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { Button, Divider, Input } from "@heroui/react";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/model/use-auth";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { randomMessageFromList } from "@/shared/lib/utils";
import { SIGNUP_MESSAGES } from "./types";

export default function CreateAccount() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const randomMessage = useMemo(
    () => randomMessageFromList(SIGNUP_MESSAGES),
    []
  );

  interface FormData extends RegisterUserRequest {
    confirmPassword: string;
  }

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    shouldUseNativeValidation: false,
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      const registerData: RegisterUserRequest = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        userName: data.userName,
        password: data.password,
        biography: null,
      };

      await register(registerData);
      addToastSuccess("You have successfully Registered!");
    } catch (error: any) {
      addToastError("Registration Failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="layout-page">
        <div className="layout-page-content">
          <form
            autoComplete="off"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <h2 className="text-lg">Create an Account</h2>

            <Input
              classNames={{ input: "text-base" }}
              label="Email"
              type="email"
              isRequired
              isInvalid={Boolean(errors.email)}
              errorMessage={errors.email?.message}
              {...formRegister("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Enter a valid email address",
                },
              })}
            />

            <Input
              classNames={{ input: "text-base" }}
              label="Username"
              isRequired
              isInvalid={Boolean(errors.userName)}
              errorMessage={errors.userName?.message}
              {...formRegister("userName", {
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
              {...formRegister("firstName", {
                required: "First Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />

            <Input
              classNames={{ input: "text-base" }}
              label="Last Name"
              isRequired
              isInvalid={Boolean(errors.lastName)}
              errorMessage={errors.lastName?.message}
              {...formRegister("lastName", {
                required: "Last Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />

            <Input
              classNames={{ input: "text-base" }}
              label="Password"
              type="password"
              isRequired
              isInvalid={Boolean(errors.password)}
              errorMessage={errors.password?.message}
              {...formRegister("password", {
                required: "Password is required",
                minLength: { value: 6, message: "At least 6 characters" },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
                  message:
                    "At least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
                },
              })}
            />

            <Input
              classNames={{ input: "text-base" }}
              label="Confirm new password"
              type="password"
              isRequired
              isInvalid={Boolean(errors.confirmPassword)}
              errorMessage={errors.confirmPassword?.message}
              {...formRegister("confirmPassword", {
                required: "Password confirmation is required",
                validate: (value) =>
                  value === getValues("password") || "Passwords do not match",
              })}
            />

            <Button
              type="submit"
              variant="solid"
              color="primary"
              disabled={loading}
              isLoading={loading}
            >
              {!loading && <RocketLaunchIcon className="w-4 h-4" />}
              Send
            </Button>
          </form>
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            <aside className="layout-page-aside-content-sticky">
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
