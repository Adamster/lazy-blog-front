"use client";

import {
  UserIcon,
  PencilSquareIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { BracketIcon, CommandButton, CommandLink } from "./command-row";

interface AccountCommandsProps {
  isAuthenticated: boolean;
  userName?: string;
  /** Whether the menu is open (gates tab-reachability of the rows). */
  open: boolean;
  /** Close the menu after navigating. */
  onNavigate: () => void;
  /** Open the auth modal (and close the menu). */
  onLogin: () => void;
  /** Log out (and close the menu). */
  onLogout: () => void;
}

/**
 * Account command block — profile / create_post / logout when authed, or a
 * single login row when not. Kept together so the right-column icons stay
 * uniform.
 */
export function AccountCommands({
  isAuthenticated,
  userName,
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
        href={`/${userName ?? ""}`}
        onClick={onNavigate}
        tabbable={open}
        trailing={<BracketIcon Icon={UserIcon} />}
      >
        profile
      </CommandLink>
      <CommandLink
        href="/create"
        onClick={onNavigate}
        tabbable={open}
        trailing={<BracketIcon Icon={PencilSquareIcon} />}
      >
        create_post
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
