import { UserIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";

import s from "./layout.module.scss";

const navigation = [
  { name: "Посты", href: "/" },
  // { name: "Категории", href: "/about" },
];

export default function Header() {
  const router = useRouter();

  return (
    <header className={s.header}>
      <div className={s.headerContainer}>
        <nav className="flex items-center ">
          <Link className="mr-6" href="/">
            <img className="h-9" src="/images/logo.png" alt="" />
          </Link>
          <ul className="flex">
            {navigation.map((item) => (
              <li key={item.name} className="mr-4">
                <Link
                  className={classNames(
                    s.link,
                    router.pathname === item.href ? s.linkActive : ""
                  )}
                  href={item.href}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={s.actions}>
          <div className={s.search}>
            <input type="text" className="input" placeholder="Поиск" />
          </div>
          <Link className={s.user} href="/auth">
            <UserIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
