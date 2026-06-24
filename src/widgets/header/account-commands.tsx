"use client";

import {
  UserIcon,
  AtSymbolIcon,
  PencilSquareIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { BracketIcon, CommandButton, CommandLink } from "./command-row";

interface AccountCommandsProps {
  isAuthenticated: boolean;
  /** Signed-in handle → links to the public profile (a menu row now). */
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
 * Account command block — create_post / edit_profile / logout when authed, or a
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
      {/* Signed-in handle → the PUBLIC profile (`/username`). A menu row now,
          one of the items — no longer pinned atop the menu / the header bar. */}
      {userName && (
        <CommandLink
          href={`/${userName}`}
          onClick={onNavigate}
          tabbable={open}
          trailing={<BracketIcon Icon={AtSymbolIcon} />}
        >
          @{userName}
        </CommandLink>
      )}
      <CommandLink
        href="/create"
        onClick={onNavigate}
        tabbable={open}
        trailing={<BracketIcon Icon={PencilSquareIcon} />}
      >
        create_post
      </CommandLink>
      {/* edit_profile → the profile settings page (redesign pending). */}
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
