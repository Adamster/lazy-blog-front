"use client";

import { PowerIcon, UserIcon } from "@heroicons/react/24/solid";
import cn from "classnames";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import s from "./header.module.scss";
import { AuthModal } from "../auth/auth-modal";

export const Header = () => {
  const { data: auth } = useSession();
  const pathname = usePathname();

  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const navigation = [{ name: "Создать", href: "/create", authRequired: true }];

  return (
    <header className={s.header}>
      <div className={s.headerInside}>
        <nav className={"flex items-center " + s.nav}>
          <Link className={s.logo} href="/">
            <div>!LAZY</div>
          </Link>
          {navigation.map(
            (item) =>
              ((item.authRequired && auth) || !item.authRequired) && (
                <Link
                  key={item.name}
                  className={cn(
                    s.link,
                    pathname === item.href ? s.linkActive : ""
                  )}
                  href={item.href}
                >
                  {item.name}
                </Link>
              )
          )}
        </nav>

        <div className={s.actions}>
          {auth ? (
            <>
              <Link
                className="flex items-center"
                href={`/${auth.user?.userName}`}
              >
                {auth.user.avatarUrl ? (
                  <Image
                    src={auth.user.avatarUrl}
                    width={30}
                    height={30}
                    alt={auth.user.userName}
                    style={{
                      borderRadius: "var(--br)",
                      objectFit: "cover",
                      maxHeight: "30px",
                      maxWidth: "30px",
                    }}
                  />
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
                onClick={() => signOut()}
              >
                <PowerIcon width={"1.3rem"} />
              </button>
            </>
          ) : (
            <button
              className="btn btn--primary"
              onClick={() => setAuthModalOpen(true)}
            >
              Войти
            </button>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </header>
  );
};
