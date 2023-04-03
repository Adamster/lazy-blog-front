import Link from "next/link";

interface Props {
  // setSignUpView: Dispatch<SetStateAction<boolean>>;
}

export default function Register({}: Props) {
  return (
    <form className="rounded-md bg-white p-8" method="POST">
      <div className="mb-4">
        <h3 className="text-2xl font-bold">Регся давай</h3>
      </div>

      <div className="flex -mx-2">
        <div className="w-1/2 px-2">
          <div className="mb-4">
            <input
              className="input"
              name="name"
              type="text"
              required
              placeholder="Имя"
            />
          </div>
        </div>

        <div className="w-1/2 px-2">
          <div className="mb-4">
            <input
              className="input"
              name="surname"
              type="text"
              required
              placeholder="Фамилия"
            />
          </div>
        </div>
      </div>

      <div className="flex -mx-2">
        <div className="w-1/2 px-2">
          <div className="mb-8">
            <input
              className="input"
              name="email"
              type="email"
              required
              placeholder="Почта"
            />
          </div>
        </div>

        <div className="w-1/2 px-2">
          <div className="mb-8">
            <input
              className="input"
              name="password"
              type="password"
              required
              placeholder="Пароль"
            />
          </div>
        </div>
      </div>

      <div>
        <button className="btn btn--primary mr-4" type="submit">
          Поехали
        </button>
        <Link href="/auth/login" className="btn">
          Передумал
        </Link>
      </div>
    </form>
  );
}
