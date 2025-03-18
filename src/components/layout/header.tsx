"use client";

import { MoonIcon, PencilSquareIcon, SunIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { AuthModal } from "../modals/user/auth-modal";
import LogoDark from "../../assets/icons/logo-dark.svg";
import LogoLight from "../../assets/icons/logo-light.svg";
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
  User,
} from "@heroui/react";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-providers";
import IsAuth from "@/guards/is-auth";
import { useRouter } from "next/navigation";

export const Header = () => {
  const { user, logout } = useAuth();
  const { isDarkTheme, changeTheme, showPreviews, setShowPreviews } =
    useTheme();
  const router = useRouter();

  const {
    isOpen: isAuthOpen,
    onOpen: onAuthOpen,
    onOpenChange: onAuthOpenChange,
  } = useDisclosure();

  return (
    <Navbar maxWidth="full">
      <div className="max-w-none mx-auto flex justify-between items-center w-full">
        <NavbarBrand className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
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
                variant="solid"
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
                    <User
                      avatarProps={{
                        size: "sm",
                        src: user?.avatarUrl || undefined,
                        name: `${user?.firstName?.charAt(
                          0
                        )}${user?.lastName?.charAt(0)}`,
                        className: "cursor-pointer",
                      }}
                      name={`${user?.firstName || ""} ${user?.lastName || ""}`}
                      description={`@${user?.userName}`}
                    />
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
                    shortcut={showPreviews ? "on" : "off"}
                    key="toggle-previews"
                    onPress={() => setShowPreviews((prev) => !prev)}
                  >
                    Post Previews
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
