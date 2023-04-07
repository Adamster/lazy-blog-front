import { generateColor } from "@/utils/generate-color";
import {
  ArrowRightOnRectangleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import cn from "classnames";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import s from "./layout.module.scss";

const navigation = [
  { name: "Посты", href: "/" },
  { name: "+", href: "/create", authRequired: true },
];

export default function Header() {
  const router = useRouter();
  const { data: authSession }: any = useSession();

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
              <div
                className={s.userAva}
                style={{
                  backgroundColor: generateColor(
                    authSession.user?.userName ?? ""
                  ),
                }}
              ></div>
              <span className={s.userName}>
                {`${authSession.user?.firstName} ${authSession.user?.lastName}`}
              </span>
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
