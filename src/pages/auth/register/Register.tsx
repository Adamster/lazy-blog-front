import AuthErrorMessage from "@/components/ErrorMessages/AuthErrorMessage";
import Loading from "@/components/loading";
import { API_URL } from "@/utils/fetcher";
import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/dist/shared/lib/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import s from "../auth.module.scss";

export default function Register() {
  const { data: auth } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = useRef("");
  const lastName = useRef("");
  const userName = useRef("");
  const email = useRef("");
  const password = useRef("");
  const confirmPassword = useRef("");

  useEffect(() => {
    if (auth) {
      router.push("/");
    }
  }, [auth, router]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);

    if (password.current !== confirmPassword.current) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);

    await axios
      .post(
        `${API_URL}/users/register`,
        {
          firstName: firstName.current,
          lastName: lastName.current,
          userName: userName.current,
          email: email.current,
          password: password.current,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(() => {
        alert("Успешно");
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

      <form className={s.form} onSubmit={handleSubmit}>
        <div className="mb-4">
          <h3 className="text-2xl font-bold">Регайся</h3>
        </div>

        {error && (
          <div className="mb-4">
            <AuthErrorMessage error={error} />
          </div>
        )}

        <div className="flex flex-wrap -mx-2 mb-4">
          <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
            <input
              className="input"
              name="username"
              type="text"
              placeholder="Username"
              required
              onChange={(e: any) => (userName.current = e.target.value)}
            />
          </div>
          <div className="w-full sm:w-1/2 px-2">
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Email"
              required
              onChange={(e: any) => (email.current = e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap -mx-2 mb-4">
          <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
            <input
              className="input"
              name="name"
              type="text"
              placeholder="Имя"
              required
              onChange={(e: any) => (firstName.current = e.target.value)}
            />
          </div>

          <div className="w-full sm:w-1/2 px-2">
            <input
              className="input"
              name="surname"
              type="text"
              required
              placeholder="Фамилия"
              onChange={(e: any) => (lastName.current = e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap -mx-2 mb-8">
          <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
            <input
              className="input"
              name="password"
              type="password"
              required
              placeholder="Пароль"
              onChange={(e: any) => (password.current = e.target.value)}
            />
          </div>

          <div className="w-full sm:w-1/2 px-2">
            <input
              className="input"
              name="confirm-password"
              type="password"
              required
              placeholder="Все еще помнишь пароль?"
              onChange={(e: any) => (confirmPassword.current = e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn--primary mr-4" type="submit">
          Поехали
        </button>

        <Link href="/auth/login" className="btn">
          Передумал
        </Link>
      </form>
    </>
  );
}
