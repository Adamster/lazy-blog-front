/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Spinner } from "@heroui/react";
import { useAuth } from "@/providers/auth-provider";
import { RegisterUserRequest } from "@/api/apis";
import { addToastError, addToastSuccess } from "@/helpers/toasts";

interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

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
      };

      await register(registerData);
      addToastSuccess("You have successfully Registered!");
      onSuccess();
    } catch (error: any) {
      addToastError("Registration Failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      autoComplete="off"
      className="flex flex-col gap-4"
    >
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
        label="Repeat Password"
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
        color="primary"
        isLoading={loading}
        className="w-full"
      >
        {loading ? <Spinner size="sm" /> : "Sign Up"}
      </Button>
    </form>
  );
}
