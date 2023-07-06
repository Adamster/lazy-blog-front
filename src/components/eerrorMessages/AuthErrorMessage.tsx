const errors: { [key: string]: string } = {
  CredentialsSignin: "Проверьте правильность введенных данных",
  "User.EmailAlreadyInUse": "Введенный Email уже используется",
  "User.UserNameAlreadyInUse": "Введенный Username уже используется",
};

interface IProps {
  error: string | string[];
}

export default function AuthErrorMessage({ error }: IProps) {
  const errorKey = Array.isArray(error) ? error[0] : error;
  const errorMessage = error && (errors[errorKey] ?? error);
  return <small className="color-danger">{errorMessage}</small>;
}
