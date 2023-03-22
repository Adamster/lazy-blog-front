import { ArrowRightOnRectangleIcon, UserIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import s from "./layout.module.scss";

const navigation = [
  { name: "Посты", href: "/" },
  { name: "абОут", href: "/about" },
];

export default function Header() {
  const router = useRouter();
  const { data: session } = useSession();

  console.log("session:", session);

  return (
    <header className={s.header}>
      <div className={s.headerContainer}>
        <nav className="flex items-center">
          <Link className="mr-6" href="/">
            <img className={s.logo} src="/images/logo.png" alt="" />
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
          {/* <div className={s.search}>
            <input type="text" className="input" placeholder="Поиск" />
          </div> */}
          {session ? (
            <div className="flex items-center">
              <span className="mr-4">{session.user?.name}</span>
              <button className={s.user} onClick={() => signOut()}>
                <ArrowRightOnRectangleIcon />
              </button>
            </div>
          ) : (
            <Link className={s.user} href="/auth/login">
              <UserIcon />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
