"use client";

import { useUserById } from "@/entities/session/model/use-user-by-id";
import { UserResponse } from "@/shared/api/openapi";
import React, { createContext, useContext } from "react";

interface UserContextType {
  user: UserResponse | undefined;
  /**
   * `true` once we have a definitive answer about the current user: either there
   * is no `userId` to fetch (logged out → resolved as "no user"), or the query
   * has settled (success/error). Guards read this so `IsAuthor` can tell
   * "still resolving the user" apart from "resolved, not the author".
   */
  isUserResolved: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export function UserProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  // Render children unconditionally (no blocking spinner) so the server tree
  // reaches the HTML for crawlers. `user` is `undefined` until the query
  // resolves on the client; consumers already treat it as optional and the
  // interactive islands re-render once it lands.
  const { data: user, isLoading } = useUserById(userId || "");

  // `isLoading` (= isPending && isFetching) is `false` for a disabled query (no
  // userId), so "logged out" reads as resolved immediately; it's only `true`
  // while an enabled query is in flight. → resolved unless actively fetching.
  const isUserResolved = !isLoading;

  return (
    <UserContext.Provider value={{ user, isUserResolved }}>
      {children}
    </UserContext.Provider>
  );
}
