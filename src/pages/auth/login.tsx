import AuthErrorMessage from "@/components/eerrorMessages/AuthErrorMessage";
import Loading from "@/components/loading";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import s from "./auth.module.scss";

export default function Login() {
  // session
  const { data: auth } = useSession();
  const router = useRouter();
  const { error } = useRouter().query;

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
      <Head>
        <title>Логин | Not Lazy Blog</title>
      </Head>

      {loading && <Loading />}

      <div className="wrapper p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold">Войти</h3>
        </div>

        {/* form */}

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
                required: {
                  value: true,
                  message: "Введите Пошту",
                },
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
                required: {
                  value: true,
                  message: "Введите Пароль",
                },
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
