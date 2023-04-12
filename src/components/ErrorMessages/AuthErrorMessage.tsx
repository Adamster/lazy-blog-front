const errors: { [key: string]: string } = {
  CredentialsSignin: "Проверьте правильность введенных данных",
  "User.EmailAlreadyInUse": "Оный email уже используется",
  "User.UserNameAlreadyInUse": "Оный username уже используется",
};

interface IProps {
  error: string | string[];
}

export default function AuthErrorMessage({ error }: IProps) {
  const errorKey = Array.isArray(error) ? error[0] : error;
  const errorMessage = error && (errors[errorKey] ?? error);
  return <p className="color-error">{errorMessage}</p>;
}
