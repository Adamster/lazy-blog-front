import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowRightOnRectangleIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

import { MoonIcon as MoonIconSolid, UserIcon } from "@heroicons/react/24/solid";
import cn from "classnames";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import s from "./layout.module.scss";

export const Header = () => {
  const router = useRouter();
  const { data: auth } = useSession();
  const { darkTheme, toggleTheme } = useTheme();

  const navigation = [
    // { name: "Домой", href: "/" },
    { name: "Создать", href: "/p/create", authRequired: true },
  ];

  return (
    <header className={s.header}>
      <div className={s.headerInside}>
        <nav className={"flex items-center " + s.nav}>
          <Link className={s.logo} href="/">
            <div>B.LAZY</div>
          </Link>
          {navigation.map(
            (item) =>
              ((item.authRequired && auth) || !item.authRequired) && (
                <Link
                  key={item.name}
                  className={cn(
                    s.link,
                    router.pathname === item.href ? s.linkActive : ""
                  )}
                  href={item.href}
                >
                  {item.name}
                </Link>
              )
          )}
        </nav>

        <div className={s.actions}>
          {/* <button className="btn btn--link" onClick={toggleTheme}>
            {darkTheme ? (
              <MoonIcon width={"1.1rem"} color="var(--color-primary)" />
            ) : (
              <MoonIconSolid width={"1.1rem"} color="var(--color-primary)" />
            )}
          </button> */}

          {auth ? (
            <>
              <Link
                className="flex items-center"
                href={`/u/${auth.user?.userName}`}
              >
                {auth.user.avatarUrl ? (
                  <Image
                    src={auth.user.avatarUrl}
                    width={24}
                    height={24}
                    alt={auth.user.userName}
                    style={{ borderRadius: "var(--br)" }}
                  ></Image>
                ) : (
                  <div
                    className="rounded-full p-1"
                    style={{ background: "var(--color-primary)" }}
                  >
                    <UserIcon color="#fff" width={".8rem"} />
                  </div>
                )}
              </Link>
              <button
                className="btn btn--link color-primary"
                onClick={() => {
                  signOut();
                }}
              >
                <ArrowRightOnRectangleIcon width={"1.3rem"} />
              </button>
            </>
          ) : (
            <Link className="btn btn--primary" href="/auth/login">
              Войти
            </Link>
          )}

          <button className="btn btn--link" onClick={toggleTheme}>
            {darkTheme ? (
              <MoonIcon width={"1.1rem"} color="var(--color-primary)" />
            ) : (
              <MoonIconSolid width={"1.1rem"} color="var(--color-primary)" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
