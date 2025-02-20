/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Loading from "@/components/loading";
import { API_URL } from "@/utils/fetcher";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import s from "../auth.module.scss";

export default function Register() {
  const { data: auth } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState("");

  useEffect(() => {
    if (auth) {
      router.push("/");
    }
  }, [auth, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/users/register`,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.uN,
          email: data.email,
          password: data.password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success("Это успех!");
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <>
        {loading && <Loading />}
        <div className="wrapper p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold">Создать аккаунт</h3>
          </div>
          <form
            className={s.form}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            autoComplete="off"
          >
            {/* Пример поля для ввода юзернейма */}
            <div className="mb-4">
              <div className="mb-1 ml-1">
                <small className={errors?.uN ? "color-danger" : "color-gray"}>
                  {errors?.uN?.message?.toString() ?? "Юзвернэйм"}
                </small>
              </div>
              <input
                className="input"
                type="text"
                {...register("uN", {
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

            {/* Остальные поля: email, пароль, подтверждение пароля, имя, фамилия */}
            {/* ... */}

            {/* {error && (
              <div className="mb-4">
                <AuthErrorMessage error={error} />
              </div>
            )} */}

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
    </Suspense>
  );
}
