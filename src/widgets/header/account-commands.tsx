"use client";

import {
  UserIcon,
  PencilSquareIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import {
  BracketIcon,
  CommandButton,
  CommandLink,
  MenuGroupLabel,
} from "./command-row";

interface AccountCommandsProps {
  isAuthenticated: boolean;
  open: boolean;
  onNavigate: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export function AccountCommands({
  isAuthenticated,
  open,
  onNavigate,
  onLogin,
  onLogout,
}: AccountCommandsProps) {
  if (!isAuthenticated) {
    return (
      <CommandButton
        onClick={onLogin}
        tabbable={open}
        trailing={<BracketIcon Icon={ArrowRightEndOnRectangleIcon} />}
      >
        login
      </CommandButton>
    );
  }

  return (
    <>
      <CommandLink
        href="/create"
        onClick={onNavigate}
        tabbable={open}
        trailing={<BracketIcon Icon={PencilSquareIcon} />}
      >
        create_post
      </CommandLink>

      <MenuGroupLabel>{"// account"}</MenuGroupLabel>

      <CommandLink
        href="/profile"
        onClick={onNavigate}
        tabbable={open}
        trailing={<BracketIcon Icon={UserIcon} />}
      >
        edit_profile
      </CommandLink>
      <CommandButton
        onClick={onLogout}
        danger
        tabbable={open}
        trailing={<BracketIcon Icon={ArrowRightStartOnRectangleIcon} />}
      >
        logout
      </CommandButton>
    </>
  );
}
