"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import axios from "axios";
import Loading from "@/components/loading";
import { API_URL } from "@/utils/fetcher";

interface RegisterFormProps {
  onSuccess: () => void; // Закрытие модалки после успешной регистрации
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<{
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>({
    shouldUseNativeValidation: false,
  });

  const onSubmit = async (data: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/users/register`,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.username,
          email: data.email,
          password: data.password,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("Вы успешно зарегистрированы!");
      onSuccess(); // Закрываем модалку
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Ошибка регистрации!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {loading && <Loading />}

      <h3 className="text-2xl font-bold text-center mb-6">Создать аккаунт</h3>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        autoComplete="off"
        className="flex flex-col gap-4"
      >
        {/* Имя пользователя */}
        <div>
          <label className="block text-sm text-gray-600">
            Имя пользователя
          </label>
          <input
            className="input"
            type="text"
            {...register("username", {
              required: { value: true, message: "Введите имя пользователя" },
              minLength: { value: 3, message: "Минимум 3 символа" },
              maxLength: { value: 20, message: "Максимум 20 символов" },
              pattern: {
                value: /^[A-Za-z0-9_.-]+$/,
                message: "Без пробелов и спецсимволов",
              },
            })}
          />
          {errors.username && (
            <span className="text-red-500 text-sm">
              {errors.username.message}
            </span>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-600">Почта</label>
          <input
            className="input"
            type="email"
            {...register("email", {
              required: { value: true, message: "Введите почту" },
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Введите валидную почту",
              },
            })}
          />
          {errors.email && (
            <span className="text-red-500 text-sm">{errors.email.message}</span>
          )}
        </div>

        {/* Пароль */}
        <div>
          <label className="block text-sm text-gray-600">Пароль</label>
          <input
            className="input"
            type="password"
            {...register("password", {
              required: { value: true, message: "Введите пароль" },
              minLength: { value: 6, message: "Минимум 6 символов" },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
                message:
                  "Минимум 6 символов, буквы в разных регистрах, цифра и символ",
              },
            })}
          />
          {errors.password && (
            <span className="text-red-500 text-sm">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Подтверждение пароля */}
        <div>
          <label className="block text-sm text-gray-600">
            Подтвердите пароль
          </label>
          <input
            className="input"
            type="password"
            {...register("confirmPassword", {
              required: { value: true, message: "Подтвердите пароль" },
              validate: (value) =>
                value === getValues("password") || "Пароли не совпадают",
            })}
          />
          {errors.confirmPassword && (
            <span className="text-red-500 text-sm">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {/* Имя */}
        <div>
          <label className="block text-sm text-gray-600">Имя</label>
          <input
            className="input"
            type="text"
            {...register("firstName", {
              required: { value: true, message: "Введите имя" },
              minLength: { value: 2, message: "Минимум 2 символа" },
            })}
          />
          {errors.firstName && (
            <span className="text-red-500 text-sm">
              {errors.firstName.message}
            </span>
          )}
        </div>

        {/* Фамилия */}
        <div>
          <label className="block text-sm text-gray-600">Фамилия</label>
          <input
            className="input"
            type="text"
            {...register("lastName", {
              required: { value: true, message: "Введите фамилию" },
              minLength: { value: 2, message: "Минимум 2 символа" },
            })}
          />
          {errors.lastName && (
            <span className="text-red-500 text-sm">
              {errors.lastName.message}
            </span>
          )}
        </div>

        <button type="submit" className="btn btn--primary w-full">
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
}
