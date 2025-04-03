"use client";

import { useAuth } from "@/features/auth/model/use-auth";
import { IsAuth } from "@/features/auth/guards/is-auth";
import { useTheme } from "@/shared/providers/theme-providers";
import { useUser } from "@/shared/providers/user-provider";
import { MoonIcon, PencilSquareIcon, SunIcon } from "@heroicons/react/24/solid";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  useDisclosure,
} from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoDark from "@/assets/icons/logo-dark.svg";
import LogoLight from "@/assets/icons/logo-light.svg";
import { AuthModal } from "../features/auth/ui/auth-modal";
import { UserAvatar } from "@/features/user/ui/user-avatar";

export const Header = () => {
  const { logout } = useAuth();
  const { user } = useUser();
  const { isDarkTheme, changeTheme } = useTheme();
  const router = useRouter();

  const {
    isOpen: isAuthOpen,
    onOpen: onAuthOpen,
    onOpenChange: onAuthOpenChange,
  } = useDisclosure();

  return (
    <Navbar maxWidth="full">
      <div className="max-w-none mx-auto flex justify-between items-center w-full">
        <NavbarBrand className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4">
            <Image
              src={isDarkTheme ? LogoLight : LogoDark}
              width={40}
              height={40}
              alt="Logo"
            />
          </Link>
        </NavbarBrand>

        <NavbarContent justify="end" className="flex items-center gap-4">
          <NavbarItem>
            <Button isIconOnly variant="flat" onPress={changeTheme}>
              {isDarkTheme ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-4 h-4" />
              )}
            </Button>
          </NavbarItem>

          <IsAuth
            fallback={
              <NavbarItem>
                <Button color="primary" onPress={onAuthOpen}>
                  Log In
                </Button>
              </NavbarItem>
            }
          >
            <NavbarItem>
              <Button
                color="primary"
                isIconOnly
                variant="flat"
                onPress={() => router.push("/create")}
              >
                <PencilSquareIcon className="w-5 h-5 " />
              </Button>
            </NavbarItem>

            <NavbarItem>
              <Dropdown shouldBlockScroll={false}>
                <DropdownTrigger>
                  <Avatar
                    src={user?.avatarUrl || undefined}
                    size="md"
                    className="cursor-pointer"
                    name={`${user?.firstName?.charAt(
                      0
                    )}${user?.lastName?.charAt(0)}`}
                  />
                </DropdownTrigger>

                <DropdownMenu aria-label="User menu">
                  <DropdownItem
                    key="user"
                    onPress={() => router.push(`/${user?.userName}`)}
                    textValue={`${user?.firstName || ""} ${
                      user?.lastName || ""
                    }`}
                  >
                    <UserAvatar user={user} />
                  </DropdownItem>

                  <DropdownItem
                    key="profile"
                    onPress={() => {
                      router.push("/profile");
                    }}
                  >
                    Edit Profile
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    color="danger"
                    onPress={() => logout()}
                  >
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </IsAuth>
        </NavbarContent>
      </div>

      <AuthModal isOpen={isAuthOpen} onOpenChange={onAuthOpenChange} />
    </Navbar>
  );
};
