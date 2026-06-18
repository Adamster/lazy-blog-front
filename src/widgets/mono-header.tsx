"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Switch,
  useDisclosure,
} from "@heroui/react";
import {
  Bars3Icon,
  MoonIcon,
  UserIcon,
  PencilSquareIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/solid";
import { useTheme } from "@/shared/providers/theme-providers";
import { useUser } from "@/shared/providers/user-provider";
import { useAuth } from "@/features/auth/model/use-auth";
import { AuthModal } from "@/features/auth/ui/auth-modal";
import { LogoSloth } from "@/shared/ui/logo-sloth";

export function MonoHeader() {
  const { isDarkTheme, changeTheme } = useTheme();
  const { user } = useUser();
  const { isAuthenticated, logout } = useAuth();
  // Portal the dropdown into a node that lives inside the themed `.mono-scope`
  // ancestry; HeroUI otherwise mounts overlays on document.body, where neither
  // the `.dark` class nor the `--m-*` tokens are in scope.
  const [menuPortal, setMenuPortal] = useState<HTMLElement | null>(null);
  const {
    isOpen: isAuthOpen,
    onOpen: onAuthOpen,
    onOpenChange: onAuthOpenChange,
  } = useDisclosure();

  const btnBase =
    "flex size-9 flex-none items-center justify-center border-2 border-[var(--m-line)] bg-[var(--m-bg)] text-[var(--m-fg)] transition-colors hover:border-[var(--m-accent)] hover:bg-[var(--m-accent)] hover:text-[var(--m-bg)]";

  // Mono square toggle used for the settings rows (reflects state; the row's
  // onPress is the actual control, so the switch is display-only).
  const switchClassNames = {
    wrapper:
      "rounded-none border-2 border-[var(--m-dim)] bg-transparent group-data-[selected=true]:border-[var(--m-accent)] group-data-[selected=true]:bg-[var(--m-accent)]",
    thumb:
      "rounded-none bg-[var(--m-muted)] group-data-[selected=true]:bg-[var(--m-bg)]",
  };

  return (
    <>
      {/* Fixed sloth logo — top left, persists on scroll */}
      <Link href="/" aria-label="Home" className="fixed top-5 left-5 z-50">
        <LogoSloth />
      </Link>

      {/* Portal target — a viewport-spanning, non-interactive node that keeps the
          overlay inside the themed scope without skewing HeroUI's placement. */}
      <div
        ref={setMenuPortal}
        className="mono-portal pointer-events-none fixed inset-0 z-40"
        aria-hidden="true"
      />

      {/* Fixed menu — top right; single trigger opens a context menu */}
      <div className="fixed top-5 right-5 z-50">
        <Dropdown
          placement="bottom-end"
          shouldBlockScroll={false}
          portalContainer={menuPortal ?? undefined}
          classNames={{
            content:
              "mono-portal pointer-events-auto min-w-[230px] max-w-[300px] rounded-none border-2 border-[var(--m-line)] bg-[var(--m-card)] p-0 text-[var(--m-fg)]",
          }}
        >
          <DropdownTrigger>
            <button type="button" aria-label="Menu" className={btnBase}>
              <Bars3Icon className="size-4" />
            </button>
          </DropdownTrigger>

          <DropdownMenu
            aria-label="Menu"
            variant="flat"
            itemClasses={{
              base: "rounded-none gap-2.5 px-4 py-2.5 text-[var(--m-fg)] data-[hover=true]:bg-[var(--m-panel)] data-[hover=true]:text-[var(--m-fg)]",
              title: "font-[inherit] text-[13px]",
            }}
          >
            {/* Account */}
            {isAuthenticated ? (
              <DropdownItem
                key="profile"
                textValue={user?.userName ?? "Profile"}
                classNames={{ title: "truncate" }}
                startContent={<UserIcon className="size-4 shrink-0" />}
                href={`/${user?.userName ?? ""}`}
              >
                @{user?.userName}
              </DropdownItem>
            ) : (
              <DropdownItem
                key="auth"
                textValue="Log in"
                showDivider
                startContent={<UserIcon className="size-4" />}
                onPress={onAuthOpen}
              >
                Log in
              </DropdownItem>
            )}

            {isAuthenticated ? (
              <DropdownItem
                key="create"
                textValue="Create post"
                showDivider
                startContent={<PencilSquareIcon className="size-4" />}
                href="/create"
              >
                Create post
              </DropdownItem>
            ) : null}

            {/* Settings — theme toggle with the switch on the right */}
            <DropdownItem
              key="theme"
              textValue="Dark mode"
              closeOnSelect={false}
              showDivider={isAuthenticated}
              startContent={<MoonIcon className="size-4" />}
              endContent={
                <Switch
                  size="sm"
                  isSelected={isDarkTheme}
                  className="pointer-events-none scale-[0.82]"
                  classNames={switchClassNames}
                  aria-hidden
                />
              }
              onPress={changeTheme}
            >
              Dark mode
            </DropdownItem>

            {/* Logout — bottom, set apart */}
            {isAuthenticated ? (
              <DropdownItem
                key="logout"
                textValue="Logout"
                classNames={{ title: "text-[var(--m-error)]" }}
                startContent={
                  <ArrowRightStartOnRectangleIcon className="size-4 text-[var(--m-error)]" />
                }
                onPress={logout}
              >
                Logout
              </DropdownItem>
            ) : null}
          </DropdownMenu>
        </Dropdown>
      </div>

      <AuthModal isOpen={isAuthOpen} onOpenChange={onAuthOpenChange} />
    </>
  );
}
