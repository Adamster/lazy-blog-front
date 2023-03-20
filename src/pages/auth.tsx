import { SignIn, SignUp } from "@/components/auth";
import Head from "next/head";
import { useState } from "react";

export default function Login() {
  const [signUpView, setSignUpView] = useState(false);
  return (
    <>
      <Head>
        <title>Вход | Not Lazy Blog</title>
      </Head>

      {signUpView ? (
        <SignUp setSignUpView={setSignUpView} />
      ) : (
        <SignIn setSignUpView={setSignUpView} />
      )}
    </>
  );
}
