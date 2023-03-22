// import { SignIn, SignUp } from "@/components/auth";
// import Head from "next/head";
// import { useState } from "react";

// export default function Login() {
//   const [signUpView, setSignUpView] = useState(false);
//   return (
//     <>
//       <Head>
//         <title>Вход | Not Lazy Blog</title>
//       </Head>

//       {/* {signUpView ? (
//         <SignUp setSignUpView={setSignUpView} />
//       ) : (
//         <SignIn setSignUpView={setSignUpView} />
//       )} */}

//     </>
//   );
// }

import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { getCsrfToken } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import s from "../auth.module.scss";
import ErrorMessage from "./error";

export default function Login({
  csrfToken,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { error } = useRouter().query;

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

      <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

      <div className="flex -mx-3">
        <div className="w-1/2 px-3 mb-6">
          <input
            className="input"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Почта"
          />
        </div>

        <div className="w-1/2 px-3 mb-6">
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

      {error && (
        <div className="mb-4">
          <ErrorMessage error={error} />
        </div>
      )}

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
