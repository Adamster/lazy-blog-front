import { Dispatch, SetStateAction } from "react";
import s from "./auth.module.scss";

interface Props {
  setSignUpView: Dispatch<SetStateAction<boolean>>;
}

export const SignIn = ({ setSignUpView }: Props) => {
  return (
    <form className={s.form} method="POST">
      <div className={s.title}>
        <h3 className="text-2xl font-bold">Логинься давай</h3>
        <div className={s.signUp} onClick={() => setSignUpView(true)}></div>
      </div>

      <div className="flex -mx-3">
        <div className="w-1/2 px-3">
          <div className="mb-6">
            <input
              className="input"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Почта"
            />
          </div>
        </div>

        <div className="w-1/2 px-3">
          <div className="mb-6">
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
      </div>

      <div>
        <button className="btn btn--primary" type="submit">
          Войти
        </button>
      </div>
    </form>
  );
};
