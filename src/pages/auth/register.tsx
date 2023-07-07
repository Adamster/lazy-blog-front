import AuthErrorMessage from "@/components/eerrorMessages/AuthErrorMessage";
import Loading from "@/components/loading";
import { API_URL } from "@/utils/fetcher";
import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/dist/shared/lib/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import s from "./auth.module.scss";

export default function Register() {
  const { data: auth } = useSession();
  const router = useRouter();

  // states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    getValues,
  } = useForm({
    shouldUseNativeValidation: false,
  });

  const onSubmit = async (data: any) => {
    setLoading(true);

    await axios
      .post(
        `${API_URL}/users/register`,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.uN,
          email: data.email,
          password: data.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(() => {
        toast.success("Это успех!");
        router.push("/auth/login");
      })
      .catch(({ response }) => {
        setError(response.data.type);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <Head>
        <title>Регистрация | Not Lazy Blog</title>
      </Head>

      {loading && <Loading />}

      <div className="wrapper p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold">Создать аккаунт</h3>
        </div>

        {/* form */}

        <form
          className={s.form}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          autoComplete="off"
        >
          <div className="mb-4">
            <div className="mb-1 ml-1">
              <small className={errors?.uN ? "color-danger" : "color-gray"}>
                {errors?.uN?.message?.toString() ?? "Юзвернэйм"}
              </small>
            </div>
            <input
              className="input"
              type="text"
              {...register("uNa", {
                required: {
                  value: true,
                  message: "Введите Юзвернэйм",
                },
                pattern: {
                  value: /^[A-Za-z0-9_.-]+$/,
                  message: "Без пробелов и спец. символов",
                },
              })}
            />
          </div>

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
                  value: /^\S+@\S+$/i,
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
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
                  message: "Большая, маленькая, циферка и символ",
                },
              })}
            />
          </div>

          <div className="mb-4">
            <div className="mb-1 ml-1">
              <small
                className={errors?.confPwd ? "color-danger" : "color-gray"}
              >
                {errors?.confPwd ? "Пароли не совпадают" : "Подтвердите пароль"}
              </small>
            </div>
            <input
              className="input"
              type="password"
              {...register("confPwd", {
                validate: (value) => value === getValues("password"),
              })}
            />
          </div>

          <div className="mb-4">
            <div className="mb-1 ml-1">
              <small
                className={errors?.firstName ? "color-danger" : "color-gray"}
              >
                {errors?.firstName?.message?.toString() ?? "Имя"}
              </small>
            </div>
            <input
              className="input"
              type="text"
              {...register("firstName", {
                required: {
                  value: true,
                  message: "Введите Имя",
                },
              })}
            />
          </div>

          <div className="mb-4">
            <div className="mb-1 ml-1">
              <small
                className={errors?.lastName ? "color-danger" : "color-gray"}
              >
                {errors?.lastName?.message?.toString() ?? "Фамилия"}
              </small>
            </div>
            <input
              className="input"
              type="text"
              {...register("lastName", {
                required: {
                  value: true,
                  message: "Введите Фамилию",
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
            <button className="btn btn--primary mr-4" type="submit">
              Поехали
            </button>
          </div>

          <p className="color-gray">
            <small>
              Бред какой-то!{" "}
              <Link href="/auth/login" className="btn btn--link">
                Нихачу
              </Link>
            </small>
          </p>
        </form>
      </div>
    </>
  );
}
