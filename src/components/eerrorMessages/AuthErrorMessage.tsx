const errors = {
  CredentialsSignin: "Проверьте правильность введенных данных",
  "User.EmailAlreadyInUse": "Оный email уже используется",
  "User.UserNameAlreadyInUse": "Оный username уже используется",
} as const;

type ErrorKey = keyof typeof errors;

interface IProps {
  error: ErrorKey[] | string;
}

export default function AuthErrorMessage({ error }: IProps) {
  const errorKey = Array.isArray(error) ? error[0] : error;
  const errorMessage = error && (errors[errorKey as ErrorKey] ?? error);

  return <p className="color-danger">{errorMessage}</p>;
}
