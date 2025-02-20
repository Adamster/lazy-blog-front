"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Loading from "@/components/loading";

interface LoginFormProps {
  onSuccess?: () => void; // Функция, вызываемая после успешного входа
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { data: auth } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onSuccess ? onSuccess() : router.push("/");
    }
  }, [auth, router, onSuccess]);

  // Форма
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string; password: string }>({
    shouldUseNativeValidation: false,
  });

  // Сабмит формы
  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false, // Отключаем автоматический редирект
    }).finally(() => setLoading(false));
  };

  return (
    <div className="p-6">
      {loading && <Loading />}

      <h3 className="text-2xl font-bold text-center mb-6">Войти</h3>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <div>
          <label className="block text-sm text-gray-600">Почта</label>
          <input
            type="email"
            className="input"
            {...register("email", {
              required: { value: true, message: "Введите почту" },
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Введите валидную почту",
              },
            })}
          />
          {errors.email && (
            <span className="text-red-500 text-sm">
              {errors.email?.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600">Пароль</label>
          <input
            type="password"
            className="input"
            {...register("password", {
              required: { value: true, message: "Введите пароль" },
            })}
          />
          {errors.password && (
            <span className="text-red-500 text-sm">
              {errors.password?.message}
            </span>
          )}
        </div>

        <button type="submit" className="btn btn--primary w-full">
          Войти
        </button>
      </form>
    </div>
  );
}
