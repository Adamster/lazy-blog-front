"use client";

import { useUserById } from "@/entities/session/model/use-user-by-id";
import { UserResponse } from "@/shared/api/openapi";
import React, { createContext, useContext } from "react";

interface UserContextType {
  user: UserResponse | undefined;
  // `true` once the current user is definitively known (no userId to fetch, or
  // the query settled) — lets `IsAuthor` tell "resolving" from "not the author".
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
  // reaches the HTML for crawlers; `user` is `undefined` until the query lands.
  const { data: user, isLoading } = useUserById(userId || "");

  // `isLoading` is `false` for a disabled query (no userId), so "logged out"
  // reads as resolved immediately — only an in-flight enabled query is loading.
  const isUserResolved = !isLoading;

  return (
    <UserContext.Provider value={{ user, isUserResolved }}>
      {children}
    </UserContext.Provider>
  );
}
