import { ArrowRightOnRectangleIcon, UserIcon } from "@heroicons/react/20/solid";
import cn from "classnames";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import s from "./layout.module.scss";

const navigation = [
  { name: "Посты", href: "/" },
  { name: "Создать", href: "/about", authRequired: true },
];

export default function Header() {
  const router = useRouter();
  const { data: authSession } = useSession();

  // console.log("session:", session);

  return (
    <header className={s.header}>
      <div className={s.headerContainer}>
        <nav className="flex items-center">
          <Link className="mr-6" href="/">
            <img className={s.logo} src="/images/logo.png" alt="" />
          </Link>
          <ul className="flex">
            {navigation.map(
              (item) =>
                ((item.authRequired && authSession) || !item.authRequired) && (
                  <li key={item.name} className="mr-4">
                    <Link
                      className={cn(
                        s.link,
                        router.pathname === item.href ? s.linkActive : ""
                      )}
                      href={item.href}
                    >
                      {item.name}
                    </Link>
                  </li>
                )
            )}
          </ul>
        </nav>
        <div className={s.actions}>
          {authSession ? (
            <div className="flex items-center">
              <span className={s.userName}>{authSession.user?.name}</span>
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
