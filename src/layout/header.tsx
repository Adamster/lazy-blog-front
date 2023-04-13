/* eslint-disable @next/next/no-img-element */
import { useTheme } from "@/contexts/ThemeContext";
import { generateColor } from "@/utils/generate-color";
import { Menu } from "@headlessui/react";
import {
  ArrowRightOnRectangleIcon,
  MoonIcon,
  UserCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import cn from "classnames";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import s from "./layout.module.scss";

export const Header = () => {
  const router = useRouter();
  const { data: auth }: any = useSession();

  const navigation = [
    { name: "Посты", href: "/" },
    { name: "Создать", href: "/p/create", authRequired: true },
  ];

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
                ((item.authRequired && auth) || !item.authRequired) && (
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
          {auth ? (
            <UserMenu authSession={auth} />
          ) : (
            <Link className={s.user} href="/auth/login">
              <UserIcon />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

function UserMenu({ authSession }: any) {
  const { darkTheme, toggleTheme } = useTheme();

  return (
    <Menu>
      <Menu.Button>
        <div className="flex items-center">
          <div
            className={s.userAva}
            style={{
              backgroundColor: generateColor(authSession.user?.userName ?? ""),
            }}
          ></div>
          <span className={s.userName}>
            {`${authSession.user?.firstName} ${authSession.user?.lastName}`}
          </span>
        </div>
      </Menu.Button>
      <Menu.Items className={s.userMenu}>
        <Menu.Item>
          <Link
            href={`/u/${authSession.user?.userName}`}
            className={s.userMenuItem}
          >
            <UserCircleIcon width={"1rem"} className="mr-3" />
            Профиль
          </Link>
        </Menu.Item>

        <Menu.Item>
          <div className={s.userMenuItem} onClick={toggleTheme}>
            <MoonIcon width={"1rem"} className="mr-3" />
            {darkTheme ? "Light side" : "Dark side"}
          </div>
        </Menu.Item>

        <Menu.Item>
          <div
            className={s.userMenuItem}
            onClick={() => {
              signOut();
            }}
          >
            <ArrowRightOnRectangleIcon width={"1rem"} className="mr-3" />
            <span>Выход тут</span>
          </div>
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}
