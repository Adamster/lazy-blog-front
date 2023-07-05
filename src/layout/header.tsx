import { useTheme } from "@/contexts/ThemeContext";
import { generateColor } from "@/utils/generate-color";
import { Menu } from "@headlessui/react";
import {
  ArrowRightOnRectangleIcon,
  MoonIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import { MoonIcon as MoonIconSolid } from "@heroicons/react/24/solid";
import cn from "classnames";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import s from "./layout.module.scss";

export const Header = () => {
  const router = useRouter();
  const { data: auth } = useSession();
  const { darkTheme, toggleTheme } = useTheme();

  const navigation = [
    { name: "Домой", href: "/" },
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
          <button className="btn btn--link" onClick={toggleTheme}>
            {darkTheme ? (
              <MoonIcon width={"1rem"} color="var(--color-primary)" />
            ) : (
              <MoonIconSolid width={"1rem"} color="var(--color-primary)" />
            )}
          </button>

          {auth ? (
            <UserMenu authSession={auth} />
          ) : (
            <Link className="btn btn--primary" href="/auth/login">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

function UserMenu({ authSession }: any) {
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
          <button
            className={s.userMenuItem}
            onClick={() => {
              signOut();
            }}
          >
            <ArrowRightOnRectangleIcon width={"1rem"} className="mr-3" />
            <span>Выход тут</span>
          </button>
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}
