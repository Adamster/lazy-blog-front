import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { getCsrfToken, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import s from "../auth.module.scss";
import AuthErrorMessage from "./error";

export default function Login({
  csrfToken,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: authSession } = useSession();
  const router = useRouter();
  const { error } = useRouter().query;

  useEffect(() => {
    if (authSession) {
      router.push("/");
    }
  }, [authSession, router]);

  return (
    <form
      method="post"
      action="/api/auth/callback/credentials"
      className={s.form}
    >
      <div className={s.title}>
        <h3 className="text-2xl font-bold">Логинься давай</h3>
        <Link href="/auth/register" className={s.register}></Link>
      </div>

      {error && (
        <div className="mb-4">
          <AuthErrorMessage error={error} />
        </div>
      )}

      <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

      <div className="flex flex-wrap -mx-2 mb-8">
        <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
          <input
            className="input"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Почта"
          />
        </div>

        <div className="w-full sm:w-1/2 px-2">
          <input
            className="input"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Пароль"
          />
        </div>
      </div>

      <div>
        <button className="btn btn--primary" type="submit">
          Войти
        </button>
      </div>
    </form>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  };
}
