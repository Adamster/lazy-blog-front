import Loading from "@/components/loading";
import { API_URL } from "@/utils/fetcher";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Register() {
  const { data: authSession } = useSession();
  const router = useRouter();

  //states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (authSession) {
      router.push("/");
    }
  }, [authSession, router]);

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    } else {
      setError(null);
    }

    setLoading(true);
    const { email, firstName, lastName, userName, password } = form;

    fetch(`${API_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, firstName, lastName, userName, password }),
    })
      .then((response) => {
        if (response.ok) {
          setLoading(false);
          alert("Успешно");
          router.push("/auth/login");
        } else {
          setLoading(false);
          alert("Ошибкен");
          throw new Error("Ошибка регистрации");
        }
      })
      .catch((error) => {
        alert("Ошибкен");
        console.error(error);
      });
  };

  return (
    <>
      {loading && <Loading />}

      <form
        className="rounded-md background-white p-in"
        method="POST"
        onSubmit={handleSubmit}
      >
        <div className="mb-4">
          <h3 className="text-2xl font-bold">Регся давай</h3>
        </div>

        {error && <p className="mb-4 color-error">{error}</p>}

        <div className="flex flex-wrap -mx-2 mb-4">
          <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
            <input
              className="input"
              name="username"
              type="text"
              placeholder="Username"
              required
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
            />
          </div>
          <div className="w-full sm:w-1/2 px-2">
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap -mx-2 mb-4">
          <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
            <input
              className="input"
              name="name"
              type="text"
              placeholder="Имя"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>

          <div className="w-full sm:w-1/2 px-2">
            <input
              className="input"
              name="surname"
              type="text"
              required
              placeholder="Фамилия"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap -mx-2 mb-8">
          <div className="w-full sm:w-1/2 px-2 mb-4 sm:mb-0">
            <input
              className="input"
              name="password"
              type="password"
              required
              placeholder="Пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="w-full sm:w-1/2 px-2">
            <input
              className="input"
              name="confirm-password"
              type="password"
              required
              placeholder="Все еще помнишь пароль?"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />
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
    </>
  );
}
