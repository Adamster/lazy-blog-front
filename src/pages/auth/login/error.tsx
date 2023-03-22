// import { SignIn, SignUp } from "@/components/auth";

const errors: { [key: string]: string } = {
  // Signin: "Try signing with a different account.",
  // OAuthSignin: "Try signing with a different account.",
  // OAuthCallback: "Try signing with a different account.",
  // OAuthCreateAccount: "Try signing with a different account.",
  // EmailCreateAccount: "Try signing with a different account.",
  // Callback: "Try signing with a different account.",
  // OAuthAccountNotLinked:
  // "To confirm your identity, sign in with the same account you used originally.",
  // EmailSignin: "Check your email address.",
  // "Sign in failed. Check the details you provided are correct.",
  CredentialsSignin: "Проверь правильность введенных данных",
  default: "Невозможно войти", //"Unable to sign in.",
};

interface IProps {
  error: string | string[];
}

export default function ErrorMessage({ error }: IProps) {
  const errorKey = Array.isArray(error) ? error[0] : error;
  const errorMessage = error && (errors[errorKey] ?? errors.default);
  return <p className="text-red-500">{errorMessage}</p>;
}
