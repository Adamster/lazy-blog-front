/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Suspense, useEffect, useState } from "react";
import AuthErrorMessage from "@/components/errorMessages/AuthErrorMessage";
import Loading from "@/components/loading";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import s from "../auth.module.scss";

function LoginClientFunction() {
  // session
  const { data: auth } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const error = searchParams.get("error");

  // states
  const [loading, setLoading] = useState(false);

  // redirect
  useEffect(() => {
    if (auth) {
      router.push("/");
    }
  }, [auth, router]);

  // form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    shouldUseNativeValidation: false,
  });

  // submit
  const onSubmit = async (data: any) => {
    setLoading(true);

    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: true,
      callbackUrl: "/",
    }).finally(() => {
      setLoading(false);
    });
  };

  return (
    <>
      {loading && <Loading />}

      <div className="wrapper p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold">Войти</h3>
        </div>

        <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-4">
            <div className="mb-1 ml-1">
              <small className={errors?.email ? "color-danger" : "color-gray"}>
                {errors?.email?.message?.toString() ?? "Пошта"}
              </small>
            </div>
            <input
              className="input"
              type="email"
              {...register("email", {
                required: { value: true, message: "Введите Пошту" },
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Введите валидную Пошту",
                },
              })}
            />
          </div>

          <div className="mb-4">
            <div className="mb-1 ml-1">
              <small
                className={errors?.password ? "color-danger" : "color-gray"}
              >
                {errors?.password?.message?.toString() ?? "Пароль"}
              </small>
            </div>
            <input
              className="input"
              type="password"
              {...register("password", {
                required: { value: true, message: "Введите Пароль" },
              })}
            />
          </div>

          {error && (
            <div className="mb-4">
              <AuthErrorMessage error={error} />
            </div>
          )}

          <div className="mb-4">
            <button className="btn btn--primary" type="submit">
              Поехали
            </button>
          </div>

          <div className="block color-gray">
            <small>
              <span>Нет аккаунта? </span>
              <Link className="btn btn--link" href="/auth/register">
                Создать
              </Link>
            </small>
          </div>
        </form>
      </div>
    </>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginClientFunction />
    </Suspense>
  );
}
