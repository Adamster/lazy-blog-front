import Loading from "@/components/loading";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import AuthErrorMessage from "../../../components/errorMessages/AuthErrorMessage";
import s from "../auth.module.scss";

export default function Login() {
  const router = useRouter();
  const { error } = useRouter().query;
  const { data: auth } = useSession();
  const [loading, setLoading] = useState(false);

  const email = useRef("");
  const password = useRef("");

  useEffect(() => {
    if (auth) {
      router.push("/");
    }
  }, [auth, router]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    await signIn("credentials", {
      email: email.current,
      password: password.current,
      redirect: true,
      callbackUrl: "/",
    });
  };

  return (
    <>
      <Head>
        <title>Логин | Not Lazy Blog</title>
      </Head>

      {loading && <Loading />}

      <form className={s.form} onSubmit={handleSubmit}>
        <div className={s.title}>
          <h3 className="text-2xl font-bold">Логинься</h3>
          <Link href="/auth/register" className={s.register}></Link>
        </div>

        {error && (
          <div className="mb-4">
            <AuthErrorMessage error={error} />
          </div>
        )}

        <div className="flex flex-wrap -mx-2 mb-8">
          <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
            <input
              className="input"
              name="email"
              type="email"
              required
              placeholder="Email"
              onChange={(e: any) => (email.current = e.target.value)}
            />
          </div>

          <div className="w-full sm:w-1/2 px-2">
            <input
              className="input"
              name="password"
              type="password"
              required
              placeholder="Пароль"
              onChange={(e: any) => (password.current = e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn--primary" type="submit">
          Поехали
        </button>
      </form>
    </>
  );
}
