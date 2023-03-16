import { SignIn, SignUp } from "@/components/auth";
import { useState } from "react";

export default function Login() {
  const [signUpView, setSignUpView] = useState(false);
  return signUpView ? (
    <SignUp setSignUpView={setSignUpView} />
  ) : (
    <SignIn setSignUpView={setSignUpView} />
  );
}
