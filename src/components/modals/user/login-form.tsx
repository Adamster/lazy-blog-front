"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Spinner } from "@heroui/react";
import { useAuth } from "@/providers/auth-provider";
import { addToastError } from "@/helpers/toasts";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { auth, login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [auth, onSuccess]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string; password: string }>({
    shouldUseNativeValidation: false,
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);

    await login(data.email, data.password)
      .catch((error) => {
        addToastError("Login Failed", error);
      })
      .finally(() => setLoading(false));
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <Input
        classNames={{ input: "text-base" }}
        isRequired
        label="Email"
        type="email"
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

      <Input
        classNames={{ input: "text-base" }}
        isRequired
        label="Password"
        type="password"
        isInvalid={Boolean(errors.password)}
        errorMessage={errors.password?.message}
        {...register("password", {
          required: "Password is required",
        })}
      />

      <Button
        type="submit"
        color="primary"
        isLoading={loading}
        className="w-full"
      >
        {loading ? <Spinner size="sm" /> : "Sign In"}
      </Button>
    </form>
  );
}
